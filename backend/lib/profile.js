const { supabaseAdmin } = require('../supabase')

function getProvider(user) {
  const providers = user?.app_metadata?.providers
  if (Array.isArray(providers) && providers.includes('google')) return 'google'
  return user?.app_metadata?.provider || 'local'
}

function getGoogleId(user) {
  const googleIdentity = user?.identities?.find(identity => identity.provider === 'google')
  return googleIdentity?.id || null
}

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    ''
  )
}

function getAvatar(user) {
  return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
}

async function ensureUserProfile(user) {
  if (!user?.id || !user?.email) {
    throw new Error('Authenticated user profile is incomplete')
  }

  const name = getDisplayName(user)
  const provider = getProvider(user)
  const googleId = provider === 'google' ? getGoogleId(user) : null

  const profile = {
    id: user.id,
    name,
    full_name: name,
    email: user.email,
    avatar: getAvatar(user),
    provider,
    google_id: googleId,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(profile, { onConflict: 'id' })
    .select('id, name, full_name, email, avatar, provider, google_id')
    .single()

  if (!error) return data

  if (error.code !== '23505' || !/email/i.test(error.message || '')) {
    throw error
  }

  const { data: existingProfile, error: lookupError } = await supabaseAdmin
    .from('users')
    .select('id, name, full_name, email, avatar, provider, google_id')
    .eq('email', user.email)
    .maybeSingle()

  if (lookupError) throw lookupError

  if (existingProfile?.id && existingProfile.id !== user.id) {
    const conflict = new Error(
      'An account already exists for this email. Link Google to the existing Supabase user before signing in with Google.'
    )
    conflict.status = 409
    throw conflict
  }

  return existingProfile
}

module.exports = { ensureUserProfile }
