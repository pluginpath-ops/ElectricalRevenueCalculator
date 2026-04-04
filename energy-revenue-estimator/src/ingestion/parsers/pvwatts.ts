import type { HourlyMatrix, TimeSeriesMetadata } from '../../types'
import { createHourlyMatrix, matrixSet } from '../../types'

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MONTH_DAY_OFFSET = MONTH_DAYS.reduce<number[]>((acc, _days, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + MONTH_DAYS[i - 1])
  return acc
}, [])

export function parsePvwatts(
  rows: string[][],
  sourceName: string,
): HourlyMatrix {
  const meta: TimeSeriesMetadata = {
    source: sourceName,
    format: 'pvwatts',
    unit: 'kWh',
    timezone: 'local',
    recordCount: 0,
    year: new Date().getFullYear(),
    warnings: [],
  }
  const matrix = createHourlyMatrix(meta)

  // Find the header row: look for Month, Day, Hour columns
  let headerRowIdx = -1
  let monthCol = -1
  let dayCol = -1
  let hourCol = -1
  let acCol = -1

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(c => c.trim().toLowerCase())
    const mIdx = row.indexOf('month')
    const dIdx = row.indexOf('day')
    const hIdx = row.indexOf('hour')
    if (mIdx >= 0 && dIdx >= 0 && hIdx >= 0) {
      headerRowIdx = i
      monthCol = mIdx
      dayCol = dIdx
      hourCol = hIdx

      // Find AC System Output column (case-insensitive, partial match)
      acCol = row.findIndex(c => c.includes('ac system output'))
      if (acCol < 0) {
        // Fallback: look for "ac" column
        acCol = row.findIndex(c => c === 'ac')
      }
      break
    }
  }

  if (headerRowIdx < 0) {
    meta.warnings.push({
      code: 'NO_DATA_HEADER',
      message: 'Could not find Month/Day/Hour header row in PVWatts file.',
      severity: 'error',
    })
    return matrix
  }

  if (acCol < 0) {
    meta.warnings.push({
      code: 'NO_AC_COLUMN',
      message: 'Could not find "AC System Output" column.',
      severity: 'error',
    })
    return matrix
  }

  // Check unit from header: "AC System Output (W)" → divide by 1000
  const headerCell = rows[headerRowIdx][acCol].trim().toLowerCase()
  const divideBy = headerCell.includes('(w)') && !headerCell.includes('(wh)') ? 1000 : 1

  let count = 0
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length <= Math.max(monthCol, dayCol, hourCol, acCol)) continue

    const month = parseInt(row[monthCol], 10) // 1–12
    const day = parseInt(row[dayCol], 10)     // 1–31
    const hour = parseInt(row[hourCol], 10)   // 0–23

    if (isNaN(month) || isNaN(day) || isNaN(hour)) continue
    if (month < 1 || month > 12) continue

    const value = parseFloat(row[acCol]) / divideBy
    if (isNaN(value)) continue

    const dayIndex = Math.min(MONTH_DAY_OFFSET[month - 1] + (day - 1), 364)
    matrixSet(matrix, dayIndex, Math.min(hour, 23), Math.max(0, value))
    count++
  }

  matrix.meta.recordCount = count

  if (count < 8000) {
    meta.warnings.push({
      code: 'LOW_RECORD_COUNT',
      message: `Only ${count} records found (expected ~8760).`,
      severity: 'warning',
    })
  }

  return matrix
}
