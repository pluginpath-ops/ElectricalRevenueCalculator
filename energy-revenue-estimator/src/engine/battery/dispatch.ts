import type { BatteryConfig } from '../../types/battery'
import { solarFollowerDispatch } from './solarFollower'
import { strikePriceDispatch } from './strikePrice'
import { hourAheadDispatch } from './hourAhead'

export interface HourlyBatteryResult {
  dispatch: number  // kWh: positive = discharge, negative = charge
  socMwh: number    // SOC at END of this hour
  revenue: number   // $ — net battery revenue this hour
}

/**
 * Run battery dispatch over all 8760 hours.
 *
 * @param genKwh   Float64Array[8760] — generation kWh per hour (scaled)
 * @param prices   Float64Array[8760] — $/MWh per hour
 * @param cfg      battery configuration
 * @returns        array of 8760 hourly results
 */
export function runBatteryDispatch(
  genKwh: Float64Array,
  prices: Float64Array,
  cfg: BatteryConfig,
): HourlyBatteryResult[] {
  const results: HourlyBatteryResult[] = new Array(8760)
  let socMwh = 0
  const isHourAhead = cfg.strategy === 'hour-ahead'
  const pointDispatchFn = cfg.strategy === 'solar-follower'
    ? solarFollowerDispatch
    : strikePriceDispatch

  for (let idx = 0; idx < 8760; idx++) {
    const gen = genKwh[idx]
    const price = prices[idx]

    const d = isHourAhead
      ? hourAheadDispatch(prices, idx, gen, socMwh, cfg)
      : pointDispatchFn(price, gen, socMwh, cfg)

    if (d > 0) {
      // Discharging: reduce SOC by energy delivered (kWh → MWh)
      socMwh = Math.max(0, socMwh - d / 1000)
    } else if (d < 0) {
      // Charging: increase SOC by energy stored (after efficiency loss)
      socMwh = Math.min(cfg.capacityMWh, socMwh + (Math.abs(d) / 1000) * cfg.efficiency)
    }

    // Battery revenue: +for discharge (selling), -for charge (buying)
    // Units: d (kWh) × price ($/MWh) ÷ 1000 (kWh→MWh) = $
    const revenue = d * price / 1000

    results[idx] = { dispatch: d, socMwh, revenue }
  }

  return results
}
