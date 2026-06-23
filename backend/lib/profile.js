const { supabaseAdmin } = require('../supabase')

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

  console.log('AUTH USER ID:', user.id)
  console.log('AUTH USER EMAIL:', user.email)

  const name = getDisplayName(user)

  const profile = {
    id: user.id,
    name,
    email: user.email,
    password: null,
    avatar: getAvatar(user),
  }

  const { data: existingProfile, error: profileFetchError } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('id', user.id)
    .maybeSingle()

  if (profileFetchError) throw profileFetchError

  console.log('PROFILE FOUND:', existingProfile)

  if (existingProfile) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(profile)
      .eq('id', user.id)
      .select('id, name, email, avatar')
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(profile, { onConflict: 'id' })
    .select('id, name, email, avatar')
    .single()

  if (error) {
    if (error.code === '23505' && /email/i.test(error.message || '')) {
      const conflict = new Error(
        'A public user profile already exists for this email with a different ID. The public.users.id must match auth.users.id.'
      )
      conflict.status = 409
      throw conflict
    }

    throw error
  }

  return data
}

module.exports = { ensureUserProfile }
