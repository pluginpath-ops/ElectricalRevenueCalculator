export function fmtDollar(v: number, decimals = 0): string {
  if (!isFinite(v)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v)
}

export function fmtNumber(v: number, decimals = 0): string {
  if (!isFinite(v)) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v)
}

export function fmtPct(v: number, decimals = 1): string {
  if (!isFinite(v)) return '—'
  return `${v.toFixed(decimals)}%`
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MONTH_OFFSET = MONTH_DAYS.reduce<number[]>((acc, _d, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + MONTH_DAYS[i - 1])
  return acc
}, [])

export function dayIndexToLabel(dayIndex: number): string {
  let m = 11
  for (let i = 11; i >= 0; i--) {
    if (dayIndex >= MONTH_OFFSET[i]) { m = i; break }
  }
  const dayOfMonth = dayIndex - MONTH_OFFSET[m] + 1
  return `${MONTH_NAMES[m]} ${dayOfMonth}`
}

export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}
