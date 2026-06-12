const { supabaseAdmin } = require('../supabase')

function normalizeGroup(group) {
  if (!group) return null

  return {
    ...group,
    name: group.group_name || group.name || 'Untitled Group',
    group_name: group.group_name || group.name || 'Untitled Group',
  }
}

async function getGroupById(groupId) {
  const { data, error } = await supabaseAdmin
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle()

  if (error) throw error

  return normalizeGroup(data)
}

async function getMembership(groupId, userId) {
  const { data, error } = await supabaseAdmin
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  return data
}

async function requireMembership(groupId, userId) {
  const membership = await getMembership(groupId, userId)
  if (!membership) {
    const error = new Error('You do not have access to this group')
    error.status = 403
    throw error
  }
}

module.exports = {
  normalizeGroup,
  getGroupById,
  getMembership,
  requireMembership,
}
