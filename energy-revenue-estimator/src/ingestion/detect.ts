import type { CsvFormat } from '../types'

/**
 * Detect CSV format from the parsed rows (first few rows only).
 * Rows should be string[][] — raw PapaParse output before any processing.
 */
export function detectFormat(rows: string[][]): CsvFormat {
  if (rows.length === 0) throw new Error('Empty CSV file')

  const header = rows[0].map(h => h.trim().toLowerCase())

  // LMP wide: has HE1 or HE2 column headers (days-as-rows, hours-as-columns)
  if (header.some(h => /^he\d+$/.test(h))) {
    return 'lmp-wide'
  }

  // PVWatts: has a row somewhere in the first 40 rows with Month/Day/Hour columns
  // (multi-metadata header before data)
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i].map(h => h.trim().toLowerCase())
    if (row.includes('month') && row.includes('day') && row.includes('hour')) {
      return 'pvwatts'
    }
  }

  // SAM wide (hours-as-rows, days-as-columns):
  // Header is "Time stamp" + numeric day-index columns.
  // Distinguishing feature: ≤ 26 data rows (24 hours + 1-2 redundant rows).
  if (
    header[0].toLowerCase().includes('time stamp') &&
    rows.length <= 27 &&
    rows.length >= 24
  ) {
    return 'sam-wide'
  }

  // Default: SAM vertical (2-column, 8760+ rows)
  return 'sam-vertical'
}
