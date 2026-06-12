const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { supabaseAdmin } = require('../supabase')
const { requireMembership } = require('./shared')

async function fetchUserMap(userIds) {
  if (!userIds.length) return new Map()

  const { data: userRows, error } = await supabaseAdmin
    .from('users')
    .select('id, name, full_name, email')
    .in('id', userIds)

  const userMap = new Map()

  if (!error && Array.isArray(userRows)) {
    for (const row of userRows) {
      userMap.set(row.id, row)
    }
  }

  const missingIds = userIds.filter(id => !userMap.has(id))
  if (!missingIds.length) {
    return userMap
  }

  const authRows = await Promise.all(
    missingIds.map(async (userId) => {
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
      userMap.set(row.id, row)
    }
  }

  return userMap
}

function shapeMessage(message, userMap, currentUserId) {
  const sender = userMap.get(message.user_id) || {}
  const senderName = sender.full_name || sender.name || sender.email?.split('@')[0] || 'Member'

  return {
    ...message,
    message: message.message || message.content || '',
    sender_name: senderName,
    sender_email: sender.email || '',
    is_current_user: message.user_id === currentUserId,
  }
}

router.get('/groups/:groupId/messages', authenticate, async (req, res) => {
  const { groupId } = req.params

  try {
    await requireMembership(groupId, req.user.id)

    const { data: messages, error } = await supabaseAdmin
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const userMap = await fetchUserMap([...new Set((messages || []).map(message => message.user_id))])

    return res.json({
      messages: (messages || []).map(message => shapeMessage(message, userMap, req.user.id)),
    })
  } catch (error) {
    console.error('GET /groups/:groupId/messages error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

router.post('/groups/:groupId/messages', authenticate, async (req, res) => {
  const { groupId } = req.params
  const messageText = `${req.body.message || req.body.content || ''}`.trim()

  if (!messageText) {
    return res.status(400).json({ error: 'Message is required' })
  }

  if (messageText.length > 1000) {
    return res.status(400).json({ error: 'Message is too long' })
  }

  try {
    await requireMembership(groupId, req.user.id)

    const { data: message, error } = await supabaseAdmin
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: req.user.id,
        message: messageText,
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const userMap = await fetchUserMap([req.user.id])

    return res.status(201).json({
      message: shapeMessage(message, userMap, req.user.id),
    })
  } catch (error) {
    console.error('POST /groups/:groupId/messages error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

module.exports = router
