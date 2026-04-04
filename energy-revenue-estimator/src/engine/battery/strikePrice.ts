import type { BatteryConfig } from '../../types/battery'

/**
 * Strike-price battery strategy (hour-by-hour, no look-ahead).
 * Charge when price < buyThreshold, discharge when price > sellThreshold.
 *
 * Returns net dispatch (kWh): positive = discharge, negative = charge.
 */
export function strikePriceDispatch(
  price: number,
  _gen: number,
  socMwh: number,
  cfg: BatteryConfig,
): number {
  const { capacityMWh, chargeRateMW, dischargeRateMW, efficiency, gridCharging } = cfg

  if (price > cfg.sellThreshold && socMwh > 0) {
    // Discharge — bounded by rate and available SOC
    const dischargeMwh = Math.min(socMwh, dischargeRateMW)
    return dischargeMwh * 1000  // kWh
  }

  if (price < cfg.buyThreshold && socMwh < capacityMWh) {
    // Charge (grid charging must be enabled if no generation)
    if (!gridCharging && _gen <= 0) return 0
    const chargeMwh = Math.min(capacityMWh - socMwh, chargeRateMW) / efficiency
    return -chargeMwh * 1000  // kWh (negative = charging)
  }

  return 0
}
