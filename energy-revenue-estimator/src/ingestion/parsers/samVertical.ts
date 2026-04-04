import type { HourlyMatrix, TimeSeriesMetadata } from '../../types'
import { createHourlyMatrix, matrixSet } from '../../types'

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// Cumulative day offsets for each month (0-indexed)
const MONTH_DAY_OFFSET = MONTH_DAYS.reduce<number[]>((acc, _days, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + MONTH_DAYS[i - 1])
  return acc
}, [])

const MONTH_NAMES: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

/**
 * Parse a SAM-style timestamp: "Jan 1, 12:00 am" or "Jan 1, 01:00 am"
 * Returns { dayIndex, hour } where dayIndex ∈ [0,364] and hour ∈ [0,23].
 */
function parseTimestamp(ts: string): { dayIndex: number; hour: number } | null {
  // Pattern: "Mon DD, HH:MM am/pm"
  const m = ts.trim().match(/^(\w+)\s+(\d+),\s+(\d+):(\d+)\s*(am|pm)$/i)
  if (!m) return null

  const monthIdx = MONTH_NAMES[m[1].toLowerCase().slice(0, 3)]
  if (monthIdx === undefined) return null

  const dayOfMonth = parseInt(m[2], 10) // 1-indexed
  let hour = parseInt(m[3], 10)
  const isPm = m[5].toLowerCase() === 'pm'

  // Convert 12-hour to 24-hour
  if (isPm && hour !== 12) hour += 12
  if (!isPm && hour === 12) hour = 0

  const dayIndex = MONTH_DAY_OFFSET[monthIdx] + (dayOfMonth - 1)
  return { dayIndex: Math.min(dayIndex, 364), hour: Math.min(hour, 23) }
}

export function parseSamVertical(
  rows: string[][],
  sourceName: string,
  unit: string,
): HourlyMatrix {
  const meta: TimeSeriesMetadata = {
    source: sourceName,
    format: 'sam-vertical',
    unit,
    timezone: 'local',
    recordCount: 0,
    year: new Date().getFullYear(),
    warnings: [],
  }
  const matrix = createHourlyMatrix(meta)

  // Skip header row; find data start (row with a parseable timestamp in col 0)
  let dataStart = 1
  for (let i = 1; i < Math.min(rows.length, 5); i++) {
    if (rows[i].length >= 2 && parseTimestamp(rows[i][0])) {
      dataStart = i
      break
    }
  }

  let count = 0
  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 2) continue

    const parsed = parseTimestamp(row[0])
    if (!parsed) continue

    const value = parseFloat(row[1])
    if (isNaN(value)) continue

    matrixSet(matrix, parsed.dayIndex, parsed.hour, value)
    count++
  }

  matrix.meta.recordCount = count

  if (count < 8000) {
    matrix.meta.warnings.push({
      code: 'LOW_RECORD_COUNT',
      message: `Only ${count} records found (expected ~8760). Data may be incomplete.`,
      severity: 'warning',
    })
  }

  return matrix
}
