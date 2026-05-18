export function formatLocalDateForApi(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function parseDateInput(value) {
  if (!value || typeof value !== 'string') {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

export function formatDisplayDate(value, options = {}) {
  const date = value instanceof Date ? value : parseDateInput(value)
  if (!date) return 'Unknown date'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function formatDisplayDateRange(fromValue, toValue) {
  if (!fromValue && !toValue) return 'Unknown range'
  if (!toValue || fromValue === toValue) return formatDisplayDate(fromValue)
  return `${formatDisplayDate(fromValue)} -> ${formatDisplayDate(toValue)}`
}
