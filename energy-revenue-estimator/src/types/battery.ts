export type BatteryStrategy = 'solar-follower' | 'strike-price' | 'hour-ahead' | 'peak-shaving'

export interface BatteryConfig {
  enabled: boolean
  /** MWh */
  capacityMWh: number
  /** MW — max charge rate */
  chargeRateMW: number
  /** MW — max discharge rate */
  dischargeRateMW: number
  /** Round-trip efficiency 0–1 */
  efficiency: number
  strategy: BatteryStrategy
  /** For strike-price strategy */
  buyThreshold: number  // $/MWh — charge when price < this
  sellThreshold: number // $/MWh — discharge when price > this
  /** Allow grid charging (i.e., charge even when generation = 0) */
  gridCharging: boolean
  /** For solar-follower: generation threshold in kWh; charge when gen > this (default 0) */
  solarChargeThresholdKwh: number
  /** For solar-follower: minimum price ($/MWh) required to discharge (default 0) */
  minDischargePrice: number
  /** For hour-ahead / peak-shaving: number of hours of price visibility (1–12) */
  lookAheadHours: number
  /** For peak-shaving: minimum combined output (solar + battery) in kW during TOU window */
  demandThresholdKw: number
  /** For peak-shaving: TOU window start hour, inclusive (0–23) */
  touStartHour: number
  /** For peak-shaving: TOU window end hour, exclusive (1–24) */
  touEndHour: number
}

export interface BatteryState {
  /** State of charge in MWh */
  socMWh: number
}

export const DEFAULT_BATTERY_CONFIG: BatteryConfig = {
  enabled: false,
  capacityMWh: 4,
  chargeRateMW: 1,
  dischargeRateMW: 1,
  efficiency: 0.85,
  strategy: 'solar-follower',
  buyThreshold: 20,
  sellThreshold: 50,
  gridCharging: false,
  solarChargeThresholdKwh: 0,
  minDischargePrice: 0,
  lookAheadHours: 4,
  demandThresholdKw: 100,
  touStartHour: 7,
  touEndHour: 21,
}
