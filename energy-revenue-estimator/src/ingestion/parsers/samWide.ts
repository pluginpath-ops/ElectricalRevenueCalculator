import type { HourlyMatrix, TimeSeriesMetadata } from '../../types'
import { createHourlyMatrix, matrixSet } from '../../types'

/**
 * SAM wide format (transposed): hours as rows, days as columns.
 *
 * Structure:
 *   Row 0 (header): "Time stamp" | "0" (redundant hour col) | "1" ... "365" (days 1-indexed)
 *   Row 1 (skip):   redundant day-of-year labels
 *   Rows 2-25:      24 actual data rows
 *     col[0] = hour index (0-indexed, 0–23)
 *     col[1] = SKIP (redundant hour-of-day column)
 *     col[2..366] = generation value for day 1..365 → dayIndex 0..364
 */
export function parseSamWide(
  rows: string[][],
  sourceName: string,
  unit: string,
): HourlyMatrix {
  const meta: TimeSeriesMetadata = {
    source: sourceName,
    format: 'sam-wide',
    unit,
    timezone: 'local',
    recordCount: 0,
    year: new Date().getFullYear(),
    warnings: [],
  }
  const matrix = createHourlyMatrix(meta)

  if (rows.length < 3) return matrix

  const header = rows[0]

  // Build day-column mapping: for each column index ≥ 2, parse the header
  // label as a 1-indexed day number → dayIndex = label - 1
  const colDayMap: (number | null)[] = header.map((h, colIdx) => {
    if (colIdx < 2) return null // skip Time stamp and redundant hour col
    const day = parseInt(h.trim(), 10)
    if (isNaN(day) || day < 1 || day > 365) return null
    return day - 1 // convert to 0-indexed dayIndex
  })

  // Skip row 0 (header) and row 1 (redundant day-of-year). Data starts at row 2.
  let count = 0
  for (let rowIdx = 2; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    if (row.length < 3) continue

    const hour = parseInt(row[0].trim(), 10) // 0-indexed
    if (isNaN(hour) || hour < 0 || hour > 23) continue

    for (let colIdx = 2; colIdx < row.length; colIdx++) {
      const dayIndex = colDayMap[colIdx]
      if (dayIndex === null) continue

      const value = parseFloat(row[colIdx])
      if (isNaN(value)) continue

      // Clamp negative generation artifacts to 0
      matrixSet(matrix, dayIndex, hour, Math.max(0, value))
      count++
    }
  }

  matrix.meta.recordCount = count

  if (count < 8000) {
    meta.warnings.push({
      code: 'LOW_RECORD_COUNT',
      message: `Only ${count} records found (expected ~8760). Data may be incomplete.`,
      severity: 'warning',
    })
  }

  return matrix
}
