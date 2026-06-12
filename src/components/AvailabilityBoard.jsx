import { useMemo } from 'react'
import { formatDisplayDateRange } from '../lib/date'

function formatTimeLabel(value) {
  const [hours = '0', minutes = '0'] = `${value || ''}`.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default function AvailabilityBoard({ entries = [], onDeleteAvailability, deletingId }) {
  const sortedEntries = useMemo(() => [...entries].sort((a, b) => {
    const aFrom = a.from_date || a.date
    const bFrom = b.from_date || b.date
    if (aFrom !== bFrom) return aFrom.localeCompare(bFrom)

    const aTo = a.to_date || aFrom
    const bTo = b.to_date || bFrom
    if (aTo !== bTo) return aTo.localeCompare(bTo)

    return `${a.start_time}`.localeCompare(`${b.start_time}`)
  }), [entries])

  if (!sortedEntries.length) {
    return (
      <div className="availability-empty">
        Shared availability will appear here as soon as members add their date ranges.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {sortedEntries.map((entry) => {
        const initials = (entry.user_name || entry.user_email || 'M')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map(part => part[0]?.toUpperCase())
          .join('')

        return (
          <div
            key={entry.id}
            className="availability-board-card availability-range-card"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="member-avatar availability-avatar">{initials || 'M'}</div>
              <div className="min-w-0">
                <p className="truncate font-bold text-dark">{entry.is_current_user ? 'You' : entry.user_name}</p>
                <p className="truncate text-xs text-muted">{entry.user_email || 'Group member'}</p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-dark">
                {formatDisplayDateRange(entry.from_date || entry.date, entry.to_date || entry.date)}
              </p>
              <p className="truncate text-xs text-muted">
                {formatTimeLabel(entry.start_time)} - {formatTimeLabel(entry.end_time)}
              </p>
            </div>

            {entry.is_current_user && onDeleteAvailability && (
              <button
                type="button"
                onClick={() => onDeleteAvailability(entry)}
                disabled={deletingId === entry.id}
                className="btn-chip btn-chip-danger shrink-0"
              >
                {deletingId === entry.id ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
