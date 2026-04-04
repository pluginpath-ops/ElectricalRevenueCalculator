import type { HourlyMatrix } from '../types/timeseries'
import { createHourlyMatrix } from '../types/timeseries'

/**
 * Shift a matrix by N hours (positive = forward in time, negative = backward).
 * Used to align datasets from different timezones.
 * Values wrap at day boundaries — midnight of day 0 wraps to hour 23 of day 364.
 */
export function shiftMatrix(matrix: HourlyMatrix, shiftHours: number): HourlyMatrix {
  if (shiftHours === 0) return matrix

  const result = createHourlyMatrix({ ...matrix.meta })
  const N = 365 * 24

  for (let d = 0; d < 365; d++) {
    for (let h = 0; h < 24; h++) {
      const srcIdx = d * 24 + h
      const dstIdx = ((srcIdx + shiftHours) % N + N) % N
      result.values[dstIdx] = matrix.values[srcIdx]
    }
  }

  return result
}
