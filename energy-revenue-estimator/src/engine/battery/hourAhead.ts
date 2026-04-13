import type { BatteryConfig } from '../../types/battery'

/**
 * Hour-Ahead Market strategy.
 *
 * Simulates a real market participant with access to hour-ahead price forecasts
 * (as published by ISOs like MISO, PJM). Within the look-ahead window the
 * operator targets a full battery cycle each day rather than trading a single
 * cheapest / most-expensive hour.
 *
 * Logic (evaluated each hour):
 *   - DISCHARGE: compute hours of discharge available (SOC / dischargeRate).
 *     Discharge when current price ≥ the K-th highest price in the window,
 *     where K = min(hoursAvailable, windowSize).  This concentrates discharge
 *     into the most expensive hours visible.
 *
 *   - CHARGE: compute hours needed to reach full capacity.
 *     Charge when current price ≤ the K-th lowest price in the window,
 *     where K = min(hoursNeeded, windowSize).  This fills the battery across
 *     the cheapest available hours rather than waiting for a single perfect one.
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
  const { capacityMWh, chargeRateMW, dischargeRateMW, efficiency, gridCharging } = cfg

  // Build sorted window prices (ascending)
  const windowEnd = Math.min(idx + cfg.lookAheadHours, prices.length)
  const windowSize = windowEnd - idx
  const sorted: number[] = []
  for (let i = idx; i < windowEnd; i++) sorted.push(prices[i])
  sorted.sort((a, b) => a - b)

  const currentPrice = prices[idx]

  // ── DISCHARGE ──────────────────────────────────────────────────────────────
  // Target the K most expensive hours; K = hours of discharge we can provide.
  if (socMwh > 0) {
    const hoursAvailable = Math.min(Math.ceil(socMwh / dischargeRateMW), windowSize)
    // Threshold = K-th highest = (windowSize - K)-th in ascending sort
    const dischargeThreshold = sorted[windowSize - hoursAvailable]
    if (currentPrice >= dischargeThreshold) {
      return Math.min(dischargeRateMW, socMwh) * 1000
    }
  }

  // ── CHARGE ─────────────────────────────────────────────────────────────────
  // Target the K cheapest hours; K = hours needed to reach full capacity.
  if (socMwh < capacityMWh) {
    if (!gridCharging && genKwh <= 0) return 0
    const hoursToFull = Math.min(Math.ceil((capacityMWh - socMwh) / chargeRateMW), windowSize)
    // Threshold = K-th lowest in ascending sort
    const chargeThreshold = sorted[hoursToFull - 1]
    if (currentPrice <= chargeThreshold) {
      const headroomMwh = capacityMWh - socMwh
      return -Math.min(chargeRateMW, headroomMwh / efficiency) * 1000
    }
  }

  return 0
}
