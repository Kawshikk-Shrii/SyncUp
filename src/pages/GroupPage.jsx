import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import Navbar from '../components/Navbar'
import AvailabilityBoard from '../components/AvailabilityBoard'
import GroupChat from '../components/GroupChat'
import LocationSharingPanel from '../components/LocationSharingPanel'
import { apiFetch } from '../lib/api'
import { formatDisplayDate, formatDisplayDateRange, formatLocalDateForApi } from '../lib/date'
import { buildGroupRecommendations } from '../lib/groupRecommendations'

function MemberCard({ member }) {
  const initials = (member.name || member.email || 'M')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')

  return (
    <div className="member-card">
      <div className="member-avatar">{initials || 'M'}</div>
      <div className="min-w-0">
        <p className="font-semibold text-dark truncate">{member.is_current_user ? 'You' : member.name}</p>
        <p className="text-xs text-dark/50 truncate">{member.email || 'SyncUp member'}</p>
      </div>
    </div>
  )
}

function formatTimeRange(startTime, endTime) {
  const toLabel = (value) => {
    const [hours = '0', minutes = '0'] = `${value || ''}`.split(':')
    const date = new Date()
    date.setHours(Number(hours), Number(minutes), 0, 0)
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
  }

  return `${toLabel(startTime)} - ${toLabel(endTime)}`
}

function hasUsableLocation(participant) {
  return participant.hasLocation || Boolean(participant.locationText?.trim()) || (
    Number.isFinite(participant.latitude) && Number.isFinite(participant.longitude)
  )
}

function createLocationParticipant(member, fallbackName = 'You') {
  const id = member?.id || member?.user_id || 'current-user'
  const isCurrentUser = Boolean(member?.is_current_user || member?.user_id === member?.current_user_id)
  const name = member?.is_current_user
    ? 'You'
    : member?.name || member?.email?.split('@')[0] || fallbackName

  return {
    id: `member-${id}`,
    memberId: id,
    name,
    email: member?.email || '',
    isCurrentUser,
    locationText: member?.location_text || '',
    latitude: Number.isFinite(member?.latitude) ? member.latitude : null,
    longitude: Number.isFinite(member?.longitude) ? member.longitude : null,
    locationSource: member?.location_source || null,
    hasLocation: Boolean(member?.has_location),
    status: 'idle',
    message: '',
  }
}

function buildSyncedLocationParticipants(previousParticipants, memberList, currentUser) {
  const previousById = new Map(previousParticipants.map(participant => [participant.id, participant]))
  const baseMembers = memberList.length > 0
    ? memberList
    : [{
        id: currentUser?.id || 'current-user',
        name: currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'You',
        email: currentUser?.email,
        is_current_user: true,
      }]

  const syncedMembers = baseMembers.map((member) => {
    const freshParticipant = createLocationParticipant(member)
    const previousParticipant = previousById.get(freshParticipant.id) || {}

    return {
      ...freshParticipant,
      status: previousParticipant.status === 'loading' ? previousParticipant.status : freshParticipant.status,
      message: previousParticipant.status === 'loading' ? previousParticipant.message : freshParticipant.message,
      name: freshParticipant.name,
      email: freshParticipant.email,
      isCurrentUser: freshParticipant.isCurrentUser,
    }
  })

  return syncedMembers
}

export default function GroupPage({ user }) {
  const navigate = useNavigate()
  const { id: groupId } = useParams()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [schedule, setSchedule] = useState(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [myAvailability, setMyAvailability] = useState([])
  const [copied, setCopied] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [sharedAvailability, setSharedAvailability] = useState([])
  const [deletingAvailabilityId, setDeletingAvailabilityId] = useState(null)
  const [locationParticipants, setLocationParticipants] = useState([])
  const [recommendations, setRecommendations] = useState(null)

  const loadSchedule = async ({ silent = false } = {}) => {
    if (!silent) {
      setScheduleLoading(true)
    }

    try {
      const data = await apiFetch(`/schedule/${groupId}`)
      setSchedule(data)
    } catch (error) {
      if (!silent) {
        toast.error(error.message || 'Failed to calculate common time')
      }
      setSchedule(null)
    } finally {
      if (!silent) {
        setScheduleLoading(false)
      }
    }
  }

  const loadGroupPage = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) {
      setPageLoading(true)
    }
    setPageError('')

    try {
      const [groupData, memberData, availabilityData, boardData, scheduleData] = await Promise.all([
        apiFetch(`/groups/details/${groupId}`),
        apiFetch(`/group-members/${groupId}`),
        apiFetch(`/availability/${groupId}`),
        apiFetch(`/availability-board/${groupId}`),
        apiFetch(`/schedule/${groupId}`),
      ])

      setGroup(groupData.group || null)
      setMembers(memberData.members || [])
      setLocationParticipants(previousParticipants => (
        buildSyncedLocationParticipants(previousParticipants, memberData.members || [], {
          id: user?.id,
          email: user?.email,
          user_metadata: { name: user?.user_metadata?.name },
        })
      ))
      setMyAvailability((availabilityData.availability || []).filter(entry => entry.user_id === user?.id))
      setSharedAvailability(boardData.availability || [])
      setSchedule(scheduleData)
    } catch (error) {
      setPageError(error.message || 'Failed to load this group')
    } finally {
      if (showLoader) {
        setPageLoading(false)
      }
    }
  }, [groupId, user?.email, user?.id, user?.user_metadata?.name])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadGroupPage()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadGroupPage])

  const isOwner = group?.created_by === user?.id || group?.is_owner
  const locatedParticipantCount = useMemo(
    () => locationParticipants.filter(hasUsableLocation).length,
    [locationParticipants]
  )
  const canFindRecommendations = locatedParticipantCount >= 2
  const selectedRangePreview = useMemo(() => {
    if (!fromDate) return ''
    return formatDisplayDateRange(
      formatLocalDateForApi(fromDate),
      formatLocalDateForApi(toDate || fromDate)
    )
  }, [fromDate, toDate])

  const updateLocationParticipant = async (participantId, updates) => {
    const targetParticipant = locationParticipants.find(participant => participant.id === participantId)
    if (!targetParticipant?.isCurrentUser) {
      toast.error('You can only share your own location')
      return
    }

    setLocationParticipants(previousParticipants => previousParticipants.map(participant => (
      participant.id === participantId ? { ...participant, ...updates } : participant
    )))

    if (updates.hasLocation) {
      try {
        const data = await apiFetch(`/groups/${groupId}/location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: updates.latitude,
            longitude: updates.longitude,
            locationText: updates.locationText,
            locationSource: updates.locationSource,
          }),
        })

        const savedLocation = data.location || {}
        setLocationParticipants(previousParticipants => previousParticipants.map(participant => (
          participant.id === participantId
            ? {
                ...participant,
                latitude: savedLocation.latitude,
                longitude: savedLocation.longitude,
                locationText: savedLocation.location_text || updates.locationText,
                locationSource: savedLocation.location_source || updates.locationSource,
                hasLocation: Boolean(savedLocation.has_location),
                status: 'success',
                message: 'Location added',
              }
            : participant
        )))
        await loadGroupPage({ showLoader: false })
      } catch (error) {
        setLocationParticipants(previousParticipants => previousParticipants.map(participant => (
          participant.id === participantId
            ? {
                ...participant,
                latitude: targetParticipant.latitude,
                longitude: targetParticipant.longitude,
                locationText: targetParticipant.locationText,
                locationSource: targetParticipant.locationSource,
                hasLocation: targetParticipant.hasLocation,
                status: 'error',
                message: error.message || 'Could not save your location',
              }
            : participant
        )))
        toast.error(error.message || 'Could not save your location')
      }
    }

    setRecommendations(null)
  }

  const handleFindRecommendations = () => {
    if (!canFindRecommendations) {
      toast.error('At least 2 group members must share their locations.')
      return
    }

    setRecommendations(buildGroupRecommendations(locationParticipants.filter(hasUsableLocation)))
    toast.success('Sync spots ready')
  }

  const handleAddAvailability = async (event) => {
    event.preventDefault()

    if (!fromDate || !toDate || !startTime || !endTime) {
      toast.error('Please fill in from date, to date, start time, and end time')
      return
    }

    const fromDateValue = formatLocalDateForApi(fromDate)
    const toDateValue = formatLocalDateForApi(toDate)

    if (fromDateValue > toDateValue) {
      toast.error('To Date must be on or after From Date')
      return
    }

    if (startTime >= endTime) {
      toast.error('End time must be after start time')
      return
    }

    setSubmitting(true)

    try {
      await apiFetch('/add-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          fromDate: fromDateValue,
          toDate: toDateValue,
          startTime,
          endTime,
        }),
      })

      setFromDate(null)
      setToDate(null)
      setStartTime('')
      setEndTime('')
      toast.success('Availability range saved')
      await loadGroupPage({ showLoader: false })
    } catch (error) {
      toast.error(error.message || 'Failed to save availability')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAvailability = async (availabilityId) => {
    setDeletingAvailabilityId(availabilityId)
    try {
      await apiFetch(`/availability/${availabilityId}`, { method: 'DELETE' })
      setMyAvailability(previous => previous.filter(entry => entry.id !== availabilityId))
      toast.success('Availability deleted')
      await loadGroupPage({ showLoader: false })
    } catch (error) {
      toast.error(error.message || 'Failed to delete availability')
    } finally {
      setDeletingAvailabilityId(null)
    }
  }

  const confirmDeleteAvailability = (entry) => {
    const confirmed = window.confirm(
      `Delete your availability from ${formatDisplayDate(entry.from_date || entry.date)} to ${formatDisplayDate(entry.to_date || entry.date)} (${formatTimeRange(entry.start_time, entry.end_time)})?`
    )

    if (!confirmed) return
    handleDeleteAvailability(entry.id)
  }

  const handleGroupAction = async () => {
    setActionLoading(true)

    try {
      if (isOwner) {
        await apiFetch(`/groups/${groupId}`, { method: 'DELETE' })
        toast.success('Group deleted')
      } else {
        await apiFetch(`/groups/${groupId}/leave`, { method: 'DELETE' })
        toast.success('You left the group')
      }

      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const copyGroupId = async () => {
    try {
      await navigator.clipboard.writeText(groupId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Group ID copied')
    } catch {
      toast.error('Could not copy the group ID')
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar user={user} variant="light" />
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
          <div className="card">
            <div className="skeleton-line h-8 w-64 rounded-lg mb-3" />
            <div className="skeleton-line h-4 w-40 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card"><div className="skeleton-line h-40 w-full rounded-2xl" /></div>
              <div className="card"><div className="skeleton-line h-56 w-full rounded-2xl" /></div>
            </div>
            <div className="space-y-6">
              <div className="card"><div className="skeleton-line h-48 w-full rounded-2xl" /></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (pageError || !group) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar user={user} variant="light" />
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="card text-center">
            <h1 className="text-2xl font-extrabold text-dark mb-2">Unable to load this group</h1>
            <p className="text-dark/60 mb-6">{pageError || 'This group may have been removed or you may not have access to it.'}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={loadGroupPage} className="btn-primary">Try Again</button>
              <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const mapsSearchTerms = 'tourist attractions cafes restaurants viewpoints hotels'

  return (
    <div className="min-h-screen bg-light">
      <Navbar user={user} variant="light" />

      <div className="bg-hero px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-dark/60 text-sm font-medium hover:text-dark mb-4 transition-colors">
            Back to Dashboard
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="text-4xl font-extrabold text-dark">{group.group_name || group.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-dark/60 text-sm font-mono">{groupId}</span>
                <button onClick={copyGroupId} className="btn-chip">
                  {copied ? 'Copied' : 'Copy ID'}
                </button>
                <span className="btn-chip">{members.length} member{members.length === 1 ? '' : 's'}</span>
              </div>
            </div>

            <button
              onClick={handleGroupAction}
              disabled={actionLoading}
              className={isOwner ? 'btn-danger' : 'btn-secondary'}
            >
              {actionLoading ? 'Working...' : isOwner ? 'Delete Group' : 'Leave Group'}
            </button>
          </div>
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.85fr)] gap-8 items-start"
      >
        <div className="flex flex-col gap-8">
          <div className="card card-elevated">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
              <div>
                <h2 className="font-bold text-dark text-xl">Members</h2>
                <p className="text-dark/55 text-sm mt-1">Everyone in this group, not just members who added availability.</p>
              </div>
              <button onClick={loadGroupPage} className="btn-chip">Refresh group</button>
            </div>

            {members.length === 0 ? (
              <p className="text-dark/50 text-sm">No members found yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {members.map(member => <MemberCard key={member.id} member={member} />)}
              </div>
            )}
          </div>

          <div className="card card-elevated">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
              <div>
                <h2 className="font-bold text-dark text-xl">Shared Availability Board</h2>
                <p className="text-dark/55 text-sm mt-1">Everyone&apos;s date ranges and daily free-time windows in one place.</p>
              </div>
              <span className="btn-chip">{sharedAvailability.length} total range{sharedAvailability.length === 1 ? '' : 's'}</span>
            </div>
            <AvailabilityBoard
              entries={sharedAvailability}
              onDeleteAvailability={confirmDeleteAvailability}
              deletingId={deletingAvailabilityId}
            />
          </div>

          <LocationSharingPanel
            participants={locationParticipants}
            onUpdateParticipant={updateLocationParticipant}
            onFindRecommendations={handleFindRecommendations}
            canFindRecommendations={canFindRecommendations}
            recommendationCount={locatedParticipantCount}
          />

          <div className="card card-elevated">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-bold text-dark text-xl">Add Your Availability</h2>
                <p className="text-dark/55 text-sm mt-1">Choose a date range and a daily time window for when you are free.</p>
              </div>
              {selectedRangePreview && <span className="btn-chip">{selectedRangePreview}</span>}
            </div>

            <form onSubmit={handleAddAvailability} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark/70 mb-1.5 uppercase tracking-wide">From Date</label>
                  <DatePicker
                    selected={fromDate}
                    onChange={(value) => {
                      setFromDate(value)
                      if (toDate && value && formatLocalDateForApi(value) > formatLocalDateForApi(toDate)) {
                        setToDate(value)
                      }
                    }}
                    minDate={new Date()}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Pick start date"
                    className="input cursor-pointer"
                    id="availability-from-date"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-dark/70 mb-1.5 uppercase tracking-wide">To Date</label>
                  <DatePicker
                    selected={toDate}
                    onChange={setToDate}
                    minDate={fromDate || new Date()}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Pick end date"
                    className="input cursor-pointer"
                    id="availability-to-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark/70 mb-1.5 uppercase tracking-wide">Start Time</label>
                  <input
                    id="start-time"
                    type="time"
                    className="input"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark/70 mb-1.5 uppercase tracking-wide">End Time</label>
                  <input
                    id="end-time"
                    type="time"
                    className="input"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    required
                  />
                </div>
              </div>

              <button id="add-availability-btn" type="submit" disabled={submitting} className="btn-primary justify-center py-3 disabled:opacity-60">
                {submitting ? 'Saving...' : '+ Save Availability Range'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#d1e8d1]">
              <div className="flex items-center justify-between gap-4 mb-3">
                <p className="text-xs font-semibold text-dark/50 uppercase tracking-wide">Your Added Ranges</p>
                <span className="text-xs text-dark/45">Only you can delete your own entries</span>
              </div>

              {myAvailability.length === 0 ? (
                <div className="availability-empty">No ranges added yet. Your saved availability will appear here.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {myAvailability.map(entry => (
                    <div key={entry.id} className="availability-card availability-card-range">
                      <div>
                        <p className="font-semibold text-dark">
                          {formatDisplayDateRange(entry.from_date || entry.date, entry.to_date || entry.date)}
                        </p>
                        <p className="text-sm text-dark/60">{formatTimeRange(entry.start_time, entry.end_time)}</p>
                      </div>
                      <button
                        onClick={() => confirmDeleteAvailability(entry)}
                        disabled={deletingAvailabilityId === entry.id}
                        className="btn-chip btn-chip-danger"
                      >
                        {deletingAvailabilityId === entry.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card border-2 border-dashed border-[#b5e8c8] bg-[#f0fdf4] card-elevated">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="font-bold text-dark text-xl">Find Common Time</h2>
                <p className="text-dark/60 text-sm mt-1">
                  SyncUp checks every day inside each member&apos;s date range and finds the earliest shared overlap.
                </p>
              </div>
              <button id="find-common-time-btn" onClick={() => loadSchedule()} disabled={scheduleLoading} className="btn-primary shrink-0 disabled:opacity-60">
                {scheduleLoading ? 'Calculating...' : 'Recalculate'}
              </button>
            </div>

            {schedule && (
              <div className="mt-5">
                {schedule.available ? (
                  <div className="bg-white rounded-2xl p-5 border border-[#b5e8c8] shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3acc78] inline-block animate-pulse" />
                      <span className="text-xs font-bold text-[#1a7a3a] uppercase tracking-wide">Common Slot Found</span>
                    </div>
                    <p className="text-2xl font-extrabold text-dark mb-0.5">{formatDisplayDate(schedule.date)}</p>
                    <p className="text-dark/70 font-semibold">{formatTimeRange(schedule.start_time, schedule.end_time)}</p>
                    <p className="text-sm text-dark/50 mt-1">Duration: {schedule.duration || 'Unknown'}</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-5 border border-[#fde8e8] shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f87171] inline-block" />
                      <span className="text-xs font-bold text-[#7a1a1a] uppercase tracking-wide">No Common Time Yet</span>
                    </div>
                    <p className="text-dark/70 text-sm">{schedule.message || 'Ask members to add more availability.'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 xl:sticky xl:top-6">
          <GroupChat groupId={groupId} currentUserId={user?.id} />

          {recommendations ? (
            <div>
              <div className="mb-4">
                <span className="section-badge bg-white">Group Sync Spots</span>
                <p className="text-dark/60 text-sm mt-2">
                  Inclusive picks for {recommendations.participantCount} participants, using near, between, route, and group-center options.
                  {recommendations.center && (
                    <span className="mt-1 block text-xs text-dark/45">
                      Approx. center: {recommendations.center.latitude.toFixed(4)}, {recommendations.center.longitude.toFixed(4)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {recommendations.categories.map((category) => (
                  <div key={category.title} className="card p-5">
                    <h3 className="font-bold text-dark">{category.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-dark/50">{category.intent}</p>
                    <div className="mt-4 flex flex-col gap-3">
                      {category.places.map((place) => {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.query} ${mapsSearchTerms}`)}`

                        return (
                          <a
                            key={place.id}
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="place-card rounded-2xl border border-[#dcefdc] bg-[#fbfefb] p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-dark">{place.name}</h4>
                                <p className="mt-1 text-sm leading-relaxed text-dark/60">{place.description}</p>
                              </div>
                              <span className="btn-chip bg-white">{place.fit}</span>
                            </div>
                            <span className="mt-3 block text-xs font-semibold text-muted">Open in Google Maps</span>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-10">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-card text-sm font-bold text-dark">Map</div>
              <h3 className="font-bold text-dark mb-1">Place Recommendations</h3>
              <p className="text-dark/50 text-sm leading-relaxed">
                Add at least 2 member locations, then SyncUp will suggest spots near, between, and around everyone.
                {schedule?.available && schedule.date ? ` Your common time is ${formatDisplayDate(schedule.date)}.` : ''}
              </p>
            </div>
          )}

          <div className="card-mint rounded-2xl p-5 shadow-card">
            <h3 className="font-bold text-dark text-sm mb-2">Share this Group</h3>
            <p className="text-dark/60 text-xs mb-3">Share the full group ID so other members can join the planning space.</p>
            <div className="bg-white rounded-xl px-3 py-2.5 font-mono text-xs text-dark/80 break-all border border-[#d1e8d1]">
              {groupId}
            </div>
            <button onClick={copyGroupId} className="btn-primary w-full justify-center mt-3 text-xs py-2.5">
              {copied ? 'Copied' : 'Copy Group ID'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
