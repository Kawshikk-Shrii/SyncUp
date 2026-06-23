const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { supabaseAdmin } = require('../supabase')
const { ensureUserProfile } = require('../lib/profile')
const { getGroupById, requireMembership } = require('./shared')

function normalizeDateString(rawDate) {
  if (typeof rawDate !== 'string') return null

  const trimmed = rawDate.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null

  return trimmed
}

function normalizeAvailabilityRow(row) {
  const fromDate = row.from_date || row.date
  const toDate = row.to_date || row.date

  return {
    ...row,
    date: fromDate,
    from_date: fromDate,
    to_date: toDate,
  }
}

function compareDateRange(a, b) {
  const aFrom = a.from_date || a.date
  const bFrom = b.from_date || b.date

  if (aFrom !== bFrom) return aFrom.localeCompare(bFrom)

  const aTo = a.to_date || aFrom
  const bTo = b.to_date || bFrom
  if (aTo !== bTo) return aTo.localeCompare(bTo)

  return `${a.start_time}`.localeCompare(`${b.start_time}`)
}

async function addAvailabilityHandler(req, res) {
  const userId = req.user.id
  const groupId = req.body.groupId || req.body.group_id
  const legacyDate = normalizeDateString(req.body.date || req.body.day)
  const fromDate = normalizeDateString(req.body.fromDate || req.body.from_date || legacyDate)
  const toDate = normalizeDateString(req.body.toDate || req.body.to_date || legacyDate)
  const startTime = req.body.startTime || req.body.start_time
  const endTime = req.body.endTime || req.body.end_time

  if (!groupId || !fromDate || !toDate || !startTime || !endTime) {
    return res.status(400).json({
      error: 'groupId, fromDate, toDate, startTime, and endTime are required',
    })
  }

  if (fromDate > toDate) {
    return res.status(400).json({ error: 'To Date must be on or after From Date' })
  }

  if (startTime >= endTime) {
    return res.status(400).json({ error: 'End time must be after start time' })
  }

  try {
    await ensureUserProfile(req.user)

    const group = await getGroupById(groupId)
    if (!group) {
      return res.status(404).json({ error: 'Group not found' })
    }

    await requireMembership(groupId, userId)

    const payload = {
      user_id: userId,
      group_id: groupId,
      date: fromDate,
      from_date: fromDate,
      to_date: toDate,
      start_time: startTime,
      end_time: endTime,
    }

    const { data, error } = await supabaseAdmin
      .from('availability')
      .insert(payload)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ availability: normalizeAvailabilityRow(data) })
  } catch (error) {
    console.error('Add availability error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
}

router.post('/add-availability', authenticate, addAvailabilityHandler)
router.post('/availability/add', authenticate, addAvailabilityHandler)

router.get('/availability/:group_id', authenticate, async (req, res) => {
  const { group_id } = req.params

  try {
    await requireMembership(group_id, req.user.id)

    const { data, error } = await supabaseAdmin
      .from('availability')
      .select('*')
      .eq('group_id', group_id)
      .order('from_date', { ascending: true, nullsFirst: false })
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
      availability: (data || []).map(normalizeAvailabilityRow).sort(compareDateRange),
    })
  } catch (error) {
    console.error('GET /availability/:group_id error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

router.get('/availability-board/:group_id', authenticate, async (req, res) => {
  const { group_id } = req.params

  try {
    await requireMembership(group_id, req.user.id)

    const { data: rows, error } = await supabaseAdmin
      .from('availability')
      .select('*')
      .eq('group_id', group_id)
      .order('from_date', { ascending: true, nullsFirst: false })
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const normalizedRows = (rows || []).map(normalizeAvailabilityRow)
    const userIds = [...new Set(normalizedRows.map(row => row.user_id))]
    let userMap = new Map()

    if (userIds.length) {
      const { data: userRows } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .in('id', userIds)

      userMap = new Map(
        (userRows || []).map(row => [
          row.id,
          {
            name: row.name || row.email?.split('@')[0] || 'Member',
            email: row.email || '',
          },
        ])
      )

      const missingIds = userIds.filter(id => !userMap.has(id))
      const authRows = await Promise.all(
        missingIds.map(async userId => {
          const { data, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
          if (authError || !data?.user) return null

          return {
            id: userId,
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Member',
            email: data.user.email || '',
          }
        })
      )

      for (const row of authRows) {
        if (row) {
          userMap.set(row.id, { name: row.name, email: row.email })
        }
      }
    }

    const entries = normalizedRows
      .map(row => {
        const profile = userMap.get(row.user_id) || {}

        return {
          ...row,
          user_name: profile.name || 'Member',
          user_email: profile.email || '',
          is_current_user: row.user_id === req.user.id,
        }
      })
      .sort(compareDateRange)

    return res.json({ availability: entries })
  } catch (error) {
    console.error('GET /availability-board/:group_id error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

router.delete('/availability/:id', authenticate, async (req, res) => {
  const { id } = req.params

  try {
    const { data: availability, error: lookupError } = await supabaseAdmin
      .from('availability')
      .select('id, user_id, group_id')
      .eq('id', id)
      .maybeSingle()

    if (lookupError) {
      return res.status(500).json({ error: lookupError.message })
    }

    if (!availability) {
      return res.status(404).json({ error: 'Availability slot not found' })
    }

    await requireMembership(availability.group_id, req.user.id)

    if (availability.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own availability' })
    }

    const { error } = await supabaseAdmin
      .from('availability')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('DELETE /availability/:id error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

module.exports = router
