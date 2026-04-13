import type { MonthlyBreakdown } from '../types/revenue'

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Cumulative day offsets: MONTH_DAY_OFFSET[m] = first dayIndex of month m (0-indexed)
export const MONTH_DAY_OFFSET = MONTH_DAYS.reduce<number[]>((acc, _days, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + MONTH_DAYS[i - 1])
  return acc
}, [])

export function dayIndexToMonth(dayIndex: number): number {
  for (let m = 11; m >= 0; m--) {
    if (dayIndex >= MONTH_DAY_OFFSET[m]) return m
  }
  return 0
}

export interface MonthlyAccum {
  generationRevenue: number
  batteryRevenue: number
  demandReductionRevenue: number
  generationKwh: number
  curtailedKwh: number
}

export function buildMonthlyBreakdown(
  accum: MonthlyAccum[],
): MonthlyBreakdown[] {
  return accum.map((a, m) => ({
    month: m + 1,
    label: MONTH_NAMES[m],
    generationRevenue: a.generationRevenue,
    batteryRevenue: a.batteryRevenue,
    demandReductionRevenue: a.demandReductionRevenue,
    totalRevenue: a.generationRevenue + a.batteryRevenue + a.demandReductionRevenue,
    generationKwh: a.generationKwh,
    curtailedKwh: a.curtailedKwh,
  }))
}
