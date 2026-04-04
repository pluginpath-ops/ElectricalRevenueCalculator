import type { HourlyMatrix, TimeSeriesMetadata } from '../../types'
import { createHourlyMatrix, matrixSet } from '../../types'

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MONTH_DAY_OFFSET = MONTH_DAYS.reduce<number[]>((acc, _days, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + MONTH_DAYS[i - 1])
  return acc
}, [])

/**
 * Parse a date string like "1/1/25" or "1/1/2025" → dayIndex [0,364].
 */
function parseDateToDayIndex(dateStr: string): number | null {
  const parts = dateStr.trim().split('/')
  if (parts.length < 2) return null
  const month = parseInt(parts[0], 10)
  const day = parseInt(parts[1], 10)
  if (isNaN(month) || isNaN(day) || month < 1 || month > 12) return null
  return Math.min(MONTH_DAY_OFFSET[month - 1] + (day - 1), 364)
}

/**
 * LMP wide format: rows = days, columns = HE1–HE24.
 * Header row: MARKET_DAY, HE1, HE2, ..., HE24
 */
export function parseLmpWide(
  rows: string[][],
  sourceName: string,
  unit: string,
): HourlyMatrix {
  const meta: TimeSeriesMetadata = {
    source: sourceName,
    format: 'lmp-wide',
    unit,
    timezone: 'local',
    recordCount: 0,
    year: new Date().getFullYear(),
    warnings: [],
  }
  const matrix = createHourlyMatrix(meta)

  if (rows.length < 2) return matrix

  const header = rows[0].map(h => h.trim().toUpperCase())

  // Build hour-column index map: HE1 → col index (hour 0), HE24 → hour 23
  const hourCols: number[] = []
  for (let h = 1; h <= 24; h++) {
    const col = header.indexOf(`HE${h}`)
    hourCols.push(col) // -1 if missing
  }

  if (hourCols.every(c => c < 0)) {
    meta.warnings.push({
      code: 'NO_HE_COLUMNS',
      message: 'No HE1–HE24 columns found in LMP wide file.',
      severity: 'error',
    })
    return matrix
  }

  let count = 0
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 2) continue

    const dayIndex = parseDateToDayIndex(row[0])
    if (dayIndex === null) continue

    for (let h = 0; h < 24; h++) {
      const col = hourCols[h]
      if (col < 0 || col >= row.length) continue
      const value = parseFloat(row[col])
      if (isNaN(value)) continue
      // HE1 = end of hour 1 = hour index 0
      matrixSet(matrix, dayIndex, h, value)
      count++
    }
  }

  matrix.meta.recordCount = count
  return matrix
}
