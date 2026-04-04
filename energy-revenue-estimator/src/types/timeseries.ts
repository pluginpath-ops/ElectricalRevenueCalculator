export type CsvFormat = 'sam-vertical' | 'pvwatts' | 'lmp-wide' | 'sam-wide'
export type SeriesType = 'generation' | 'price'

export interface ValidationWarning {
  code: string
  message: string
  severity: 'warning' | 'error'
}

export interface TimeSeriesMetadata {
  source: string
  format: CsvFormat
  unit: string
  timezone: string
  recordCount: number
  year: number
  warnings: ValidationWarning[]
}

/**
 * Core data structure. Values stored as kWh (generation) or $/MWh (price).
 * matrix[dayIndex][hour] where dayIndex ∈ [0,364], hour ∈ [0,23].
 * Total 365 × 24 = 8760 cells.
 */
export interface HourlyMatrix {
  /** Row-major: values[dayIndex * 24 + hour] */
  values: Float64Array
  meta: TimeSeriesMetadata
}

export function createHourlyMatrix(meta: TimeSeriesMetadata): HourlyMatrix {
  return {
    values: new Float64Array(365 * 24).fill(NaN),
    meta,
  }
}

export function matrixGet(m: HourlyMatrix, day: number, hour: number): number {
  return m.values[day * 24 + hour]
}

export function matrixSet(m: HourlyMatrix, day: number, hour: number, v: number): void {
  m.values[day * 24 + hour] = v
}
