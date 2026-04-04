import Papa from 'papaparse'
import type { HourlyMatrix } from '../types'
import { detectFormat } from './detect'
import { parseSamVertical } from './parsers/samVertical'
import { parsePvwatts } from './parsers/pvwatts'
import { parseLmpWide } from './parsers/lmpWide'
import { parseSamWide } from './parsers/samWide'
import { validateMatrix } from './validate'

export interface NormalizeOptions {
  sourceName: string
  unit: string
  seriesType: 'generation' | 'price'
}

/**
 * Parse raw CSV text into an HourlyMatrix.
 * Detects format automatically and dispatches to the correct parser.
 */
export async function normalizeCSV(
  csvText: string,
  opts: NormalizeOptions,
): Promise<HourlyMatrix> {
  const result = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
    header: false,
  })

  const rows = result.data as string[][]
  const format = detectFormat(rows)

  let matrix: HourlyMatrix
  switch (format) {
    case 'sam-vertical':
      matrix = parseSamVertical(rows, opts.sourceName, opts.unit)
      break
    case 'pvwatts':
      matrix = parsePvwatts(rows, opts.sourceName)
      break
    case 'lmp-wide':
      matrix = parseLmpWide(rows, opts.sourceName, opts.unit)
      break
    case 'sam-wide':
      matrix = parseSamWide(rows, opts.sourceName, opts.unit)
      break
  }

  // Append validation warnings
  const valWarnings = validateMatrix(matrix, opts.seriesType)
  matrix.meta.warnings.push(...valWarnings)

  return matrix
}
