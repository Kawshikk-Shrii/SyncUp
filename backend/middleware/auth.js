const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

/**
 * Middleware: Verify Supabase JWT from Authorization header.
 * Attaches req.user if valid.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized – no token' })
  }

  const token = authHeader.split(' ')[1]

  // Create a per-request client with the user's JWT
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized – invalid token' })
  }

  req.user = user
  req.supabase = supabase
  next()
}

module.exports = { authenticate }
