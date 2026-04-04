import type { HourlyMatrix, ValidationWarning } from '../types'
import { matrixGet } from '../types'

export function validateMatrix(
  matrix: HourlyMatrix,
  seriesType: 'generation' | 'price',
): ValidationWarning[] {
  const warnings: ValidationWarning[] = []
  let missingCount = 0
  let negativeCount = 0
  let maxVal = -Infinity
  let minVal = Infinity

  for (let d = 0; d < 365; d++) {
    for (let h = 0; h < 24; h++) {
      const v = matrixGet(matrix, d, h)
      if (isNaN(v)) {
        missingCount++
        continue
      }
      if (v < minVal) minVal = v
      if (v > maxVal) maxVal = v
      if (seriesType === 'generation' && v < -0.01) negativeCount++
    }
  }

  if (missingCount > 0) {
    warnings.push({
      code: 'MISSING_VALUES',
      message: `${missingCount} hours have missing data (shown as 0 in calculations).`,
      severity: missingCount > 100 ? 'error' : 'warning',
    })
  }

  if (negativeCount > 0) {
    warnings.push({
      code: 'NEGATIVE_GENERATION',
      message: `${negativeCount} hours have negative generation values (will be treated as 0).`,
      severity: 'warning',
    })
  }

  // Outlier detection: value > 5× median is flagged
  if (seriesType === 'price' && maxVal > 1000) {
    warnings.push({
      code: 'PRICE_OUTLIER',
      message: `Max price of ${maxVal.toFixed(0)} $/MWh appears unusually high. Check data.`,
      severity: 'warning',
    })
  }

  if (seriesType === 'generation' && maxVal > 10000) {
    warnings.push({
      code: 'GENERATION_OUTLIER',
      message: `Max generation of ${maxVal.toFixed(0)} kWh appears unusually high. Check data.`,
      severity: 'warning',
    })
  }

  return warnings
}
