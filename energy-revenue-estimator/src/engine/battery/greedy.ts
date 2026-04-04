import type { BatteryConfig } from '../../types/battery'

/**
 * Greedy 24-hour look-ahead battery strategy.
 * Returns an array of 24 net dispatch values (kWh) for a single day.
 * Positive = discharge, Negative = charge.
 *
 * @param dayPrices  array of 24 prices ($/MWh)
 * @param dayGen     array of 24 generation values (kWh) — after scaling, after curtailment signal
 * @param initSocMwh battery SOC at start of day (MWh)
 * @param cfg        battery configuration
 */
export function greedyDayDispatch(
  dayPrices: number[],
  dayGen: number[],
  initSocMwh: number,
  cfg: BatteryConfig,
): number[] {
  const capMwh = cfg.capacityMWh
  const maxCharge = cfg.chargeRateMW  // MWh per hour (assuming 1h intervals)
  const maxDischarge = cfg.dischargeRateMW
  const eff = cfg.efficiency
  const gridCharging = cfg.gridCharging

  // Rank hours by price
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const byPrice = [...hours].sort((a, b) => dayPrices[a] - dayPrices[b])

  const dispatch = new Array<number>(24).fill(0)
  let soc = initSocMwh

  // Identify discharge hours (highest prices) and charge hours (lowest prices)
  // Simple greedy: charge cheapest hours, discharge dearest hours
  const chargeHours = byPrice.slice(0, 12)
  const dischargeHours = byPrice.slice(12).reverse()

  // Assign charges
  for (const h of chargeHours) {
    if (soc >= capMwh) break
    const available = dayGen[h]
    const canChargeFromGen = available > 0 ? Math.min(available, maxCharge) : 0
    const canChargeFromGrid = gridCharging ? maxCharge : 0
    const chargeAmount = Math.min(
      capMwh - soc,
      gridCharging ? Math.max(canChargeFromGen, canChargeFromGrid) : canChargeFromGen,
    ) / eff // energy into battery ÷ eff = energy drawn from system
    if (chargeAmount <= 0) continue
    // Negative dispatch = charging (drawing from system)
    dispatch[h] = -chargeAmount
    soc = Math.min(capMwh, soc + chargeAmount * eff)
  }

  // Assign discharges
  for (const h of dischargeHours) {
    if (soc <= 0) break
    const dischargeAmount = Math.min(soc, maxDischarge)
    if (dischargeAmount <= 0) continue
    dispatch[h] = dischargeAmount
    soc = Math.max(0, soc - dischargeAmount)
  }

  return dispatch
}
