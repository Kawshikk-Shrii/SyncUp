const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config()
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase env vars are missing. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env or the app root .env.')
}

// Service role client. Keep this key server-side only.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

module.exports = { supabaseAdmin }
