import type { BatteryConfig } from '../../types/battery'
import { solarFollowerDispatch } from './solarFollower'
import { strikePriceDispatch } from './strikePrice'
import { hourAheadDispatch } from './hourAhead'
import { peakShavingDispatch } from './peakShaving'

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

  const needsFullArray = cfg.strategy === 'hour-ahead' || cfg.strategy === 'peak-shaving'
  const pointDispatchFn = cfg.strategy === 'solar-follower'
    ? solarFollowerDispatch
    : strikePriceDispatch

  for (let idx = 0; idx < 8760; idx++) {
    const gen = genKwh[idx]
    const price = prices[idx]

    let d: number
    if (cfg.strategy === 'hour-ahead') {
      d = hourAheadDispatch(prices, idx, gen, socMwh, cfg)
    } else if (cfg.strategy === 'peak-shaving') {
      d = peakShavingDispatch(prices, idx, gen, socMwh, cfg)
    } else {
      d = pointDispatchFn(price, gen, socMwh, cfg)
    }

    if (d > 0) {
      // Discharging: reduce SOC by energy delivered (kWh → MWh)
      socMwh = Math.max(0, socMwh - d / 1000)
    } else if (d < 0) {
      // Charging: increase SOC by energy stored (after efficiency loss)
      socMwh = Math.min(cfg.capacityMWh, socMwh + (Math.abs(d) / 1000) * cfg.efficiency)
    }

    // Revenue: d (kWh) × price ($/MWh) ÷ 1000 = $
    const revenue = d * price / 1000

    results[idx] = { dispatch: d, socMwh, revenue }
  }

  // suppress unused variable warning — needsFullArray documents intent
  void needsFullArray

  return results
}
