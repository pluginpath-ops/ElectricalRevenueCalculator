import type { BatteryConfig } from '../../types/battery'

/**
 * Peak-Shaving / Demand-Response battery strategy.
 *
 * Inside TOU window (price > 0):
 *   - Gen ≥ threshold: charge on the surplus (gen − threshold) without
 *     violating the demand obligation.
 *   - Gen < threshold: discharge exactly enough to cover the shortfall.
 *
 * Inside TOU window (price ≤ 0):
 *   TOU obligation suspended.  Falls through to look-ahead charging below.
 *
 * Outside TOU window (or inside at price ≤ 0):
 *   Charge at the cheapest look-ahead hour.  Before 15:00 (3 PM) an urgency
 *   rule relaxes the "uniquely cheapest" constraint — the battery will charge
 *   at any hour whose price is at or below the look-ahead window average so
 *   it arrives at the afternoon demand window as full as possible.
 *
 * @param prices   Full 8760-hour price array
 * @param idx      Current hour index (0–8759)
 * @param genKwh   Generation this hour in kWh (== kW for 1-hr intervals)
 * @param socMwh   Current state of charge in MWh
 * @param cfg      Battery configuration
 * @returns kWh dispatch: positive = discharge, negative = charge, 0 = idle
 */
export function peakShavingDispatch(
  prices: Float64Array,
  idx: number,
  genKwh: number,
  socMwh: number,
  cfg: BatteryConfig,
): number {
  const hour = idx % 24
  const price = prices[idx]
  const { capacityMWh, chargeRateMW, dischargeRateMW, efficiency, gridCharging } = cfg
  const inWindow = hour >= cfg.touStartHour && hour < cfg.touEndHour

  // ── Inside TOU window at positive price ───────────────────────────────────
  if (inWindow && price > 0) {
    const surplusKwh = genKwh - cfg.demandThresholdKw

    if (surplusKwh > 0 && socMwh < capacityMWh) {
      // Solar exceeds threshold — absorb surplus into battery
      const headroomMwh = capacityMWh - socMwh
      // Charge power limited by: rate, available surplus, and battery headroom
      const chargeMwh = Math.min(chargeRateMW, surplusKwh / 1000, headroomMwh / efficiency)
      return -chargeMwh * 1000  // negative = charging
    }

    if (surplusKwh < 0 && socMwh > 0) {
      // Solar below threshold — discharge to cover the gap
      const shortfallKwh = -surplusKwh
      const maxDischargeKwh = Math.min(dischargeRateMW * 1000, socMwh * 1000)
      return Math.min(shortfallKwh, maxDischargeKwh)  // positive = discharge
    }

    return 0
  }

  // ── Charging (outside TOU, or inside TOU at price ≤ 0) ───────────────────
  if (socMwh >= capacityMWh) return 0
  if (!gridCharging && genKwh <= 0) return 0

  // Build sorted look-ahead window (ascending price)
  const windowEnd = Math.min(idx + cfg.lookAheadHours, prices.length)
  const windowSize = windowEnd - idx
  const sorted: number[] = []
  for (let i = idx; i < windowEnd; i++) sorted.push(prices[i])
  sorted.sort((a, b) => a - b)

  // Target K cheapest hours to reach a full charge — K scales with how empty
  // the battery is, so the strategy naturally charges across multiple hours
  // and becomes more selective as the battery fills.
  const hoursToFull = Math.min(Math.ceil((capacityMWh - socMwh) / chargeRateMW), windowSize)
  const chargeThreshold = sorted[hoursToFull - 1]

  // Also charge unconditionally when price is at or below the strike price
  const belowStrike = cfg.peakShavingBuyBelow > 0 && price <= cfg.peakShavingBuyBelow

  if (price <= chargeThreshold || belowStrike) {
    const headroomMwh = capacityMWh - socMwh
    const chargeMwh = Math.min(chargeRateMW, headroomMwh / efficiency)
    return -chargeMwh * 1000  // negative = charging
  }

  return 0
}
