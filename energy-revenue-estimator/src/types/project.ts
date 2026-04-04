import type { HourlyMatrix } from './timeseries'
import type { BatteryConfig } from './battery'
import type { RevenueSummary } from './revenue'

export interface Scenario {
  id: string
  name: string
  batteryConfig: BatteryConfig
  scalingFactor: number
  summary: RevenueSummary
  createdAt: number
}

export type AppStep = 'import' | 'configure' | 'results'

export interface ProjectState {
  generation: HourlyMatrix | null
  price: HourlyMatrix | null
  /** UTC offset in hours for generation data (e.g. -5 = Eastern, -6 = Central) */
  generationUtcOffset: number
  /** UTC offset in hours for price data */
  priceUtcOffset: number
  batteryConfig: BatteryConfig
  scalingFactor: number
  activeStep: AppStep
  results: RevenueSummary | null
  isCalculating: boolean
  scenarios: Scenario[]
}
