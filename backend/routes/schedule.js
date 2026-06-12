const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { supabaseAdmin } = require('../supabase')
const { requireMembership } = require('./shared')

const PLACES = {
  Summer: [
    { name: 'Ooty', description: 'The Queen of Hill Stations with misty mountains and tea gardens.' },
    { name: 'Coorg', description: "Karnataka's coffee country with lush valleys and cascading waterfalls." },
    { name: 'Manali', description: 'Adventure hub in the Himalayas with snowy peaks and river valleys.' },
    { name: 'Munnar', description: 'Rolling tea estates, cool weather, and panoramic hill views.' },
  ],
  Monsoon: [
    { name: 'Goa', description: 'A greener, calmer side of Goa with beaches and dramatic monsoon skies.' },
    { name: 'Lonavala', description: 'Waterfalls, ghats, and cool mountain air near Mumbai.' },
    { name: 'Alleppey', description: 'Backwater serenity and lush scenery at its monsoon best.' },
  ],
  Winter: [
    { name: 'Jaipur', description: 'Pleasant winter days for forts, palaces, and city walks.' },
    { name: 'Rann of Kutch', description: 'A spectacular white desert experience under crisp winter skies.' },
    { name: 'Kerala', description: 'Comfortable weather for beaches, houseboats, and long scenic drives.' },
  ],
}

function getSeason(dateStr) {
  const [, month] = `${dateStr}`.split('-').map(Number)
  if (month >= 3 && month <= 6) return 'Summer'
  if (month >= 7 && month <= 9) return 'Monsoon'
  return 'Winter'
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

function minutesFromTime(time) {
  const [hours = '0', minutes = '0'] = `${time}`.split(':')
  return (Number(hours) * 60) + Number(minutes)
}

function timeFromMinutes(totalMinutes) {
  const hours = `${Math.floor(totalMinutes / 60)}`.padStart(2, '0')
  const minutes = `${totalMinutes % 60}`.padStart(2, '0')
  return `${hours}:${minutes}`
}

function durationLabel(startTime, endTime) {
  const totalMinutes = minutesFromTime(endTime) - minutesFromTime(startTime)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`
  return `${minutes}m`
}

function* eachDateInRange(fromDate, toDate) {
  const current = new Date(`${fromDate}T00:00:00`)
  const end = new Date(`${toDate}T00:00:00`)

  while (current <= end) {
    const year = current.getFullYear()
    const month = `${current.getMonth() + 1}`.padStart(2, '0')
    const day = `${current.getDate()}`.padStart(2, '0')
    yield `${year}-${month}-${day}`
    current.setDate(current.getDate() + 1)
  }
}

function findOverlapForDate(entries, memberIds) {
  const boundaries = [...new Set(
    entries.flatMap(entry => [minutesFromTime(entry.start_time), minutesFromTime(entry.end_time)])
  )].sort((a, b) => a - b)

  if (boundaries.length < 2) return null

  const qualifyingSegments = []

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const segmentStart = boundaries[index]
    const segmentEnd = boundaries[index + 1]
    if (segmentStart >= segmentEnd) continue

    const everyoneCovered = memberIds.every(memberId =>
      entries.some(entry =>
        entry.user_id === memberId
        && minutesFromTime(entry.start_time) <= segmentStart
        && minutesFromTime(entry.end_time) >= segmentEnd
      )
    )

    if (!everyoneCovered) continue

    const lastSegment = qualifyingSegments[qualifyingSegments.length - 1]
    if (lastSegment && lastSegment.end === segmentStart) {
      lastSegment.end = segmentEnd
    } else {
      qualifyingSegments.push({ start: segmentStart, end: segmentEnd })
    }
  }

  if (!qualifyingSegments.length) return null

  return qualifyingSegments[0]
}

async function computeSchedule(groupId) {
  const { data: members, error: memberError } = await supabaseAdmin
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  if (memberError) throw memberError
  if (!members?.length) {
    return { available: false, message: 'No members in this group yet.' }
  }

  const memberIds = [...new Set(members.map(member => member.user_id))]

  const { data: rows, error: availabilityError } = await supabaseAdmin
    .from('availability')
    .select('*')
    .eq('group_id', groupId)
    .order('from_date', { ascending: true, nullsFirst: false })
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (availabilityError) throw availabilityError
  if (!rows?.length) {
    return { available: false, message: 'No availability added yet. Ask members to add their free times.' }
  }

  const byDate = new Map()

  for (const rawRow of rows) {
    const row = normalizeAvailabilityRow(rawRow)

    for (const date of eachDateInRange(row.from_date, row.to_date)) {
      if (!byDate.has(date)) {
        byDate.set(date, [])
      }

      byDate.get(date).push({
        user_id: row.user_id,
        start_time: row.start_time,
        end_time: row.end_time,
      })
    }
  }

  const sortedDates = [...byDate.keys()].sort((a, b) => a.localeCompare(b))

  for (const date of sortedDates) {
    const entries = byDate.get(date) || []
    const uniqueUsers = [...new Set(entries.map(entry => entry.user_id))]
    if (uniqueUsers.length < memberIds.length) continue

    const overlap = findOverlapForDate(entries, memberIds)
    if (!overlap) continue

    const startTime = timeFromMinutes(overlap.start)
    const endTime = timeFromMinutes(overlap.end)
    const season = getSeason(date)

    return {
      available: true,
      date,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: overlap.end - overlap.start,
      duration: durationLabel(startTime, endTime),
      season,
      places: PLACES[season] || [],
    }
  }

  return {
    available: false,
    message: 'No common time slot found across the selected date ranges. Try widening the range or adjusting the time window.',
  }
}

router.get('/schedule/:group_id', authenticate, async (req, res) => {
  const { group_id } = req.params

  try {
    await requireMembership(group_id, req.user.id)
    const result = await computeSchedule(group_id)
    return res.json(result)
  } catch (error) {
    console.error('GET /schedule/:group_id error:', error)
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error' })
  }
})

module.exports = router
