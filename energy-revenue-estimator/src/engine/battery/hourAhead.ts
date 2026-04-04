import type { BatteryConfig } from '../../types/battery'

/**
 * Hour-Ahead Market strategy.
 *
 * Simulates a real market participant with access to hour-ahead price forecasts
 * (as published by ISOs like MISO, PJM). Within the look-ahead window the
 * operator can see upcoming prices and acts optimally within that horizon.
 *
 * Logic (evaluated each hour):
 *   - Build the window: current hour + next (lookAheadHours - 1) hours.
 *   - Discharge if current price is the maximum in the window AND SOC > 0.
 *   - Charge    if current price is the minimum in the window AND SOC < capacity.
 *   - Otherwise idle.
 *
 * Ties (multiple hours at the same price) default to idle so the battery
 * waits for a clearly better opportunity — avoids churning at flat prices.
 *
 * @param prices     Full 8760-hour price array
 * @param idx        Current hour index
 * @param genKwh     Generation this hour (used for grid-charging guard)
 * @param socMwh     Current state of charge (MWh)
 * @param cfg        Battery configuration
 * @returns kWh dispatch: positive = discharge, negative = charge, 0 = idle
 */
export function hourAheadDispatch(
  prices: Float64Array,
  idx: number,
  genKwh: number,
  socMwh: number,
  cfg: BatteryConfig,
): number {
  const lookAhead = cfg.lookAheadHours
  const windowEnd = Math.min(idx + lookAhead, prices.length)
  const currentPrice = prices[idx]

  let windowMin = Infinity
  let windowMax = -Infinity
  let minCount = 0
  let maxCount = 0

  for (let i = idx; i < windowEnd; i++) {
    const p = prices[i]
    if (p < windowMin) { windowMin = p; minCount = 1 }
    else if (p === windowMin) minCount++
    if (p > windowMax) { windowMax = p; maxCount = 1 }
    else if (p === windowMax) maxCount++
  }

  const { capacityMWh, chargeRateMW, dischargeRateMW, efficiency, gridCharging } = cfg

  // Discharge: current hour is uniquely the most expensive in window
  if (currentPrice === windowMax && maxCount === 1 && socMwh > 0) {
    const dischargeMwh = Math.min(dischargeRateMW, socMwh)
    return dischargeMwh * 1000  // kWh
  }

  // Charge: current hour is uniquely the cheapest in window
  if (currentPrice === windowMin && minCount === 1 && socMwh < capacityMWh) {
    if (!gridCharging && genKwh <= 0) return 0
    const headroomMwh = capacityMWh - socMwh
    const chargeMwh = Math.min(chargeRateMW, headroomMwh / efficiency)
    return -chargeMwh * 1000  // kWh (negative = charging)
  }

  return 0
}
