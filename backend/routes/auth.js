const express = require('express')
const router = express.Router()
const { supabaseAdmin } = require('../supabase')
const { authenticate } = require('../middleware/auth')
const { ensureUserProfile } = require('../lib/profile')

/**
 * POST /signup
 * Creates a new user via Supabase Admin Auth.
 * Body: { email, password, name }
 */
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: name || '' },
    email_confirm: false,
  })

  if (error) return res.status(400).json({ error: error.message })

  const user = data.user

  // Insert into custom users table
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .upsert({
      id: user.id,
      name: name || '',
      full_name: name || '',
      email: email,
      avatar: null,
      provider: 'local',
      google_id: null,
      updated_at: new Date().toISOString(),
    })

  if (dbError) {
    return res.status(400).json({ error: dbError.message })
  }

  return res.json({ user })
})

/**
 * POST /login
 * Signs in a user and returns the session.
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: error.message })
  return res.json({ session: data.session, user: data.user })
})

/**
 * POST /auth/sync
 * Ensures the authenticated Supabase user has a matching public profile row.
 */
router.post('/auth/sync', authenticate, async (req, res) => {
  try {
    const profile = await ensureUserProfile(req.user)
    return res.json({ profile })
  } catch (error) {
    console.error('POST /auth/sync error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Unable to sync user profile' })
  }
})

module.exports = router
