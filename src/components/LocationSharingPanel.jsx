import { getCurrentLocation } from '../lib/location'

function statusText(participant) {
  if (participant.status === 'loading') return 'Requesting location...'
  if (participant.status === 'error') return participant.message
  if (participant.hasLocation && participant.isCurrentUser) return 'Your location added'
  if (participant.hasLocation) return 'Location shared'
  if (participant.isCurrentUser) return 'Waiting for your location'
  return 'Waiting for member location'
}

export default function LocationSharingPanel({
  participants,
  onUpdateParticipant,
  onFindRecommendations,
  canFindRecommendations,
  recommendationCount,
}) {
  const handleUseGps = async (participantId) => {
    onUpdateParticipant(participantId, {
      status: 'loading',
      message: 'SyncUp uses your location only to suggest fair meetup spots for your group.',
    })

    try {
      const location = await getCurrentLocation()
      await onUpdateParticipant(participantId, {
        latitude: location.latitude,
        longitude: location.longitude,
        locationText: `GPS location (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`,
        locationSource: 'gps',
        hasLocation: true,
        status: 'success',
        message: 'Location added',
      })
    } catch (error) {
      onUpdateParticipant(participantId, {
        status: 'error',
        message: error.message,
      })
    }
  }

  const handleManualChange = async (participantId, value) => {
    await onUpdateParticipant(participantId, {
      locationText: value,
      latitude: null,
      longitude: null,
      locationSource: value.trim() ? 'manual' : null,
      hasLocation: Boolean(value.trim()),
      status: value.trim() ? 'success' : 'idle',
      message: value.trim() ? 'Manual location added' : '',
    })
  }

  return (
    <div className="card card-elevated">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">Meetup Locations</p>
          <h2 className="text-2xl font-extrabold text-dark">Find places that work for everyone</h2>
          <p className="mt-2 text-sm leading-relaxed text-dark/60">
            Share your group&apos;s locations and SyncUp suggests hangout spots near, between, and around everyone.
          </p>
        </div>
        <span className="btn-chip shrink-0">{recommendationCount} location{recommendationCount === 1 ? '' : 's'} ready</span>
      </div>

      <div className="mt-5 rounded-2xl bg-[#f5fbf6] px-4 py-3 text-sm text-dark/65">
        Use your current location to find fair meetup spots for your group. SyncUp asks through your browser and keeps this MVP data only on this page.
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {participants.map((participant) => (
          <div key={participant.id} className="rounded-2xl border border-[#dcefdc] bg-[#fbfefb] p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-bold text-dark">{participant.name}</h3>
                <p className="truncate text-xs text-dark/45">{participant.email || 'SyncUp member'}</p>
                <p className="mt-1 text-xs text-dark/50">{statusText(participant)}</p>
              </div>
              {participant.locationSource && (
                <span className="btn-chip bg-white">{participant.locationSource === 'gps' ? 'GPS' : 'Manual'}</span>
              )}
            </div>

            {participant.isCurrentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => handleUseGps(participant.id)}
                  disabled={participant.status === 'loading'}
                  className="btn-primary w-full justify-center py-2.5"
                >
                  {participant.status === 'loading' ? 'Getting Location...' : 'Use My Current Location'}
                </button>

                <div className="mt-3">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-dark/60">
                    Enter location manually instead
                  </label>
                  <input
                    className="input"
                    value={participant.locationText}
                    onChange={(event) => handleManualChange(participant.id, event.target.value)}
                    placeholder="Area, landmark, campus, or address"
                  />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-[#dcefdc] bg-white/70 px-4 py-3 text-sm text-dark/55">
                {participant.hasLocation ? 'Shared by this member' : 'This member needs to share from their own account.'}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-dark/55">At least 2 group members must share their locations.</p>
        <button
          type="button"
          onClick={onFindRecommendations}
          disabled={!canFindRecommendations}
          className="btn-primary justify-center py-3 disabled:opacity-50"
        >
          Find Sync Spots
        </button>
      </div>
    </div>
  )
}
