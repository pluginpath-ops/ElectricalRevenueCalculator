import type { BatteryConfig } from '../../types/battery'

/**
 * Solar Follower dispatch strategy — fully causal, no look-ahead.
 *
 * Logic:
 *   - Charge when generation is above the charge threshold (default 0 kWh,
 *     meaning any positive solar output triggers charging).
 *   - Discharge when generation drops to/below the charge threshold AND SOC > 0.
 *   - Optionally restrict discharge to hours when price >= minDischargePrice.
 *
 * Returns kWh to dispatch this hour:
 *   positive = discharge (selling to grid)
 *   negative = charge (consuming from grid/generation)
 */
export function solarFollowerDispatch(
  price: number,
  genKwh: number,
  socMwh: number,
  cfg: BatteryConfig,
): number {
  const capacityMWh = cfg.capacityMWh
  const chargeRateMwh = cfg.chargeRateMW   // MW × 1 hr = MWh per hour
  const dischargeRateMwh = cfg.dischargeRateMW

  const chargeThresholdKwh = cfg.solarChargeThresholdKwh
  const isGenerating = genKwh > chargeThresholdKwh
  const minPrice = cfg.minDischargePrice

  if (isGenerating) {
    // Charge — absorb up to chargeRate, limited by headroom in battery
    const headroomMwh = capacityMWh - socMwh
    if (headroomMwh <= 0) return 0
    // Charge power drawn from generation (before efficiency loss)
    const chargeMwh = Math.min(chargeRateMwh, headroomMwh / cfg.efficiency)
    return -chargeMwh * 1000  // return kWh (negative = charging)
  } else {
    // Discharge — release up to dischargeRate, only if SOC > 0 and price meets minimum
    if (socMwh <= 0) return 0
    if (price < minPrice) return 0
    const dischargeMwh = Math.min(dischargeRateMwh, socMwh)
    return dischargeMwh * 1000  // return kWh (positive = discharging)
  }
}
