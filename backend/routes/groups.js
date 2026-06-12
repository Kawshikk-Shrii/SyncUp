const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { supabaseAdmin } = require('../supabase')
const { normalizeGroup, getGroupById, getMembership, requireMembership } = require('./shared')

function isMissingGroupNameColumn(error, columnName) {
  const message = error?.message || ''
  return new RegExp(`('${columnName}'|\\b${columnName}\\b).*column|column.*('${columnName}'|\\b${columnName}\\b)|schema cache`, 'i').test(message)
}

function isMissingOptionalTable(error) {
  const message = error?.message || ''
  return /relation .* does not exist|could not find the table|schema cache/i.test(message)
}

async function deleteGroupChildren(groupId) {
  const childTables = [
    'group_messages',
    'availability',
    'group_member_locations',
    'group_members',
  ]

  for (const table of childTables) {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('group_id', groupId)

    if (error && !isMissingOptionalTable(error)) {
      throw error
    }
  }
}

async function fetchMemberProfiles(groupId, currentUserId) {
  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('group_members')
    .select('user_id, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (membershipError) throw membershipError

  const userIds = memberships.map(member => member.user_id)
  if (!userIds.length) return []

  let profiles = []
  const { data: userRows, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, name, full_name, email')
    .in('id', userIds)

  if (!userError && Array.isArray(userRows)) {
    profiles = userRows
  }

  const profileMap = new Map(profiles.map(profile => [profile.id, profile]))
  const locationMap = new Map()

  const { data: locationRows, error: locationError } = await supabaseAdmin
    .from('group_member_locations')
    .select('user_id, location_text, latitude, longitude, location_source, updated_at')
    .eq('group_id', groupId)

  if (!locationError && Array.isArray(locationRows)) {
    for (const row of locationRows) {
      locationMap.set(row.user_id, row)
    }
  }

  const authProfiles = await Promise.all(
    userIds
      .filter(userId => !profileMap.has(userId))
      .map(async userId => {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (error || !data?.user) return null

        return {
          id: userId,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Member',
          email: data.user.email || '',
        }
      })
  )

  for (const profile of authProfiles) {
    if (profile) {
      profileMap.set(profile.id, profile)
    }
  }

  return memberships.map(member => {
    const profile = profileMap.get(member.user_id) || {}
    const location = locationMap.get(member.user_id) || {}
    const displayName = profile.full_name || profile.name || profile.email?.split('@')[0] || 'Member'

    return {
      id: member.user_id,
      user_id: member.user_id,
      name: displayName,
      email: profile.email || '',
      joined_at: member.joined_at,
      is_current_user: member.user_id === currentUserId,
      location_text: location.location_text || '',
      latitude: Number.isFinite(location.latitude) ? location.latitude : null,
      longitude: Number.isFinite(location.longitude) ? location.longitude : null,
      location_source: location.location_source || null,
      location_updated_at: location.updated_at || null,
      has_location: Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
        || Boolean(location.location_text),
    }
  })
}

router.get('/groups', authenticate, async (req, res) => {
  const userId = req.user.id

  try {
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)

    if (membershipError) {
      return res.status(500).json({ error: membershipError.message })
    }

    if (!memberships?.length) {
      return res.json({ groups: [] })
    }

    const groupIds = memberships.map(membership => membership.group_id)

    const { data: groups, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false })

    if (groupError) {
      return res.status(500).json({ error: groupError.message })
    }

    return res.json({ groups: (groups || []).map(normalizeGroup) })
  } catch (error) {
    console.error('GET /groups error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

async function listGroupsForUser(userId, res) {
  try {
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)

    if (membershipError) {
      return res.status(500).json({ error: membershipError.message })
    }

    if (!memberships?.length) {
      return res.json({ groups: [] })
    }

    const groupIds = memberships.map(membership => membership.group_id)

    const { data: groups, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false })

    if (groupError) {
      return res.status(500).json({ error: groupError.message })
    }

    return res.json({ groups: (groups || []).map(normalizeGroup) })
  } catch (error) {
    console.error('GET groups for user error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

router.get('/groups/user/:user_id', authenticate, async (req, res) => {
  return listGroupsForUser(req.params.user_id, res)
})

router.get('/groups/details/:id', authenticate, async (req, res) => {
  const { id } = req.params

  try {
    await requireMembership(id, req.user.id)
    const group = await getGroupById(id)

    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }

    const members = await fetchMemberProfiles(id, req.user.id)

    return res.json({
      group: {
        ...group,
        member_count: members.length,
        is_owner: group.created_by === req.user.id,
      },
    })
  } catch (error) {
    console.error('GET /groups/details/:id error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

router.get('/groups/:user_id', authenticate, async (req, res) => {
  return listGroupsForUser(req.params.user_id, res)
})

router.get('/group-members/:groupId', authenticate, async (req, res) => {
  const { groupId } = req.params

  try {
    await requireMembership(groupId, req.user.id)
    const members = await fetchMemberProfiles(groupId, req.user.id)
    return res.json({ members })
  } catch (error) {
    console.error('GET /group-members/:groupId error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

router.put('/groups/:groupId/location', authenticate, async (req, res) => {
  const { groupId } = req.params
  const latitude = Number(req.body.latitude)
  const longitude = Number(req.body.longitude)
  const locationText = typeof req.body.locationText === 'string' ? req.body.locationText.trim() : ''
  const locationSource = req.body.locationSource === 'manual' ? 'manual' : 'gps'

  if (!locationText && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
    return res.status(400).json({ error: 'Location is required' })
  }

  try {
    await requireMembership(groupId, req.user.id)

    const { data, error } = await supabaseAdmin
      .from('group_member_locations')
      .upsert(
        {
          group_id: groupId,
          user_id: req.user.id,
          latitude: Number.isFinite(latitude) ? latitude : null,
          longitude: Number.isFinite(longitude) ? longitude : null,
          location_text: locationText,
          location_source: locationSource,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'group_id,user_id' }
      )
      .select('user_id, location_text, latitude, longitude, location_source, updated_at')
      .single()

    if (error) {
      if (/group_member_locations/i.test(error.message || '')) {
        return res.status(500).json({
          error: 'Location sharing table is not ready. Run the latest database setup SQL, then try again.',
        })
      }

      return res.status(500).json({ error: error.message })
    }

    return res.json({
      location: {
        user_id: data.user_id,
        location_text: data.location_text || '',
        latitude: data.latitude,
        longitude: data.longitude,
        location_source: data.location_source,
        location_updated_at: data.updated_at,
        has_location: Number.isFinite(data.latitude) && Number.isFinite(data.longitude)
          || Boolean(data.location_text),
      },
    })
  } catch (error) {
    console.error('PUT /groups/:groupId/location error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

async function createGroupHandler(req, res) {
  const userId = req.user.id
  const groupName = (req.body.name || req.body.group_name || '').trim()

  if (!groupName) {
    return res.status(400).json({ error: 'Group name is required' })
  }

  try {
    let group
    let groupError

    const primaryInsert = await supabaseAdmin
      .from('groups')
      .insert({
        group_name: groupName,
        created_by: userId,
      })
      .select()
      .single()

    group = primaryInsert.data
    groupError = primaryInsert.error

    if (groupError && isMissingGroupNameColumn(groupError, 'group_name')) {
      const nameInsert = await supabaseAdmin
        .from('groups')
        .insert({
          name: groupName,
          created_by: userId,
        })
        .select()
        .single()

      group = nameInsert.data
      groupError = nameInsert.error
    }

    if (groupError) {
      return res.status(500).json({ error: groupError.message })
    }

    const { error: membershipError } = await supabaseAdmin
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId })

    if (membershipError) {
      return res.status(500).json({ error: membershipError.message })
    }

    return res.status(200).json({ group: normalizeGroup(group) })
  } catch (error) {
    console.error('Create group error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

router.post('/create-group', authenticate, createGroupHandler)
router.post('/groups/create', authenticate, createGroupHandler)

async function joinGroupHandler(req, res) {
  const userId = req.user.id
  const groupId = req.body.groupId || req.body.group_id

  if (!groupId) {
    return res.status(400).json({ error: 'Group ID is required' })
  }

  try {
    const group = await getGroupById(groupId)
    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }

    const existingMembership = await getMembership(groupId, userId)
    if (existingMembership) {
      return res.status(200).json({ success: true, message: 'Already a member', group })
    }

    const { error: membershipError } = await supabaseAdmin
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId })

    if (membershipError) {
      return res.status(500).json({ error: membershipError.message })
    }

    return res.status(200).json({ success: true, group })
  } catch (error) {
    console.error('Join group error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

router.post('/join-group', authenticate, joinGroupHandler)
router.post('/groups/join', authenticate, joinGroupHandler)

router.delete('/groups/:id/leave', authenticate, async (req, res) => {
  const { id } = req.params

  try {
    const group = await getGroupById(id)
    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }

    if (group.created_by === req.user.id) {
      return res.status(400).json({ error: 'Group creator cannot leave. Delete the group instead.' })
    }

    const membership = await getMembership(id, req.user.id)
    if (!membership) {
      return res.status(404).json({ error: 'You are not a member of this group' })
    }

    const { error: availabilityError } = await supabaseAdmin
      .from('availability')
      .delete()
      .eq('group_id', id)
      .eq('user_id', req.user.id)

    if (availabilityError) {
      return res.status(500).json({ error: availabilityError.message })
    }

    const { error: membershipError } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('user_id', req.user.id)

    if (membershipError) {
      return res.status(500).json({ error: membershipError.message })
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('DELETE /groups/:id/leave error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

router.delete('/groups/:id', authenticate, async (req, res) => {
  const { id } = req.params

  try {
    const group = await getGroupById(id)

    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }

    if (group.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the group creator can delete this group' })
    }

    await deleteGroupChildren(id)

    const { error } = await supabaseAdmin
      .from('groups')
      .delete()
      .eq('id', id)
      .eq('created_by', req.user.id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('DELETE /groups/:id error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
