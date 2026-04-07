import type { HourlyMatrix } from '../types/timeseries'
import type { BatteryConfig } from '../types/battery'
import type { HourlyRevenueRecord, RevenueSummary } from '../types/revenue'
import { matrixGet } from '../types/timeseries'
import { runBatteryDispatch } from './battery/dispatch'
import { dayIndexToMonth, buildMonthlyBreakdown, type MonthlyAccum } from './aggregations'

/**
 * Main revenue calculation engine.
 * Runs over all 8760 hours, computes revenue, optionally dispatches battery.
 */
export function calculateRevenue(
  generation: HourlyMatrix,
  price: HourlyMatrix,
  batteryConfig: BatteryConfig,
  scalingFactor: number,
): RevenueSummary {
  // Build flat arrays for performance
  const genKwh = new Float64Array(8760)
  const prices = new Float64Array(8760)

  for (let d = 0; d < 365; d++) {
    for (let h = 0; h < 24; h++) {
      const idx = d * 24 + h
      const rawGen = matrixGet(generation, d, h)
      genKwh[idx] = isNaN(rawGen) ? 0 : Math.max(0, rawGen) * scalingFactor
      const rawPrice = matrixGet(price, d, h)
      prices[idx] = isNaN(rawPrice) ? 0 : rawPrice
    }
  }

  // Run battery dispatch if enabled
  const batteryResults = batteryConfig.enabled
    ? runBatteryDispatch(genKwh, prices, batteryConfig)
    : null

  // Accumulators
  const monthly: MonthlyAccum[] = Array.from({ length: 12 }, () => ({
    generationRevenue: 0,
    batteryRevenue: 0,
    generationKwh: 0,
    curtailedKwh: 0,
  }))

  const hourly: HourlyRevenueRecord[] = []

  let annualGenRevenue = 0
  let annualBatRevenue = 0
  let totalGenKwh = 0
  let totalCurtKwh = 0
  let peakGenKwh = 0
  let batteryTotalKwh = 0  // sum of discharged kWh

  for (let d = 0; d < 365; d++) {
    for (let h = 0; h < 24; h++) {
      const idx = d * 24 + h
      const gen = genKwh[idx]
      const price = prices[idx]
      const month = dayIndexToMonth(d)

      // Curtail if price < 0
      const curtailed = price < 0 ? gen : 0
      const effectiveGen = curtailed > 0 ? 0 : gen

      // Generation revenue
      // Convert kWh to MWh for revenue: gen(kWh) * price($/MWh) / 1000
      const genRevenue = effectiveGen * price / 1000

      // Battery
      const bat = batteryResults ? batteryResults[idx] : null
      const batDispatch = bat?.dispatch ?? 0
      const batRevenue = bat?.revenue ?? 0
      const socMwh = bat?.socMwh ?? 0

      if (batDispatch > 0) batteryTotalKwh += batDispatch

      // Demand shortfall (peak-shaving strategy only)
      // Only counts during TOU window at positive prices — negative price hours
      // suspend the obligation (grid is oversupplied; consumption is the right action)
      let demandShortfallKwh = 0
      if (
        batteryConfig.strategy === 'peak-shaving' &&
        price > 0 &&
        h >= batteryConfig.touStartHour &&
        h < batteryConfig.touEndHour
      ) {
        const combinedKwh = effectiveGen + Math.max(0, batDispatch)
        demandShortfallKwh = Math.max(0, batteryConfig.demandThresholdKw - combinedKwh)
      }

      // Totals
      annualGenRevenue += genRevenue
      annualBatRevenue += batRevenue
      totalGenKwh += effectiveGen
      totalCurtKwh += curtailed
      if (gen > peakGenKwh) peakGenKwh = gen

      monthly[month].generationRevenue += genRevenue
      monthly[month].batteryRevenue += batRevenue
      monthly[month].generationKwh += effectiveGen
      monthly[month].curtailedKwh += curtailed

      hourly.push({
        dayIndex: d,
        hour: h,
        generationKwh: gen,
        batteryDischargeKwh: Math.max(0, batDispatch),
        batteryChargeKwh: Math.abs(Math.min(0, batDispatch)),
        curtailedKwh: curtailed,
        priceDollarsPerMwh: price,
        generationRevenue: genRevenue,
        batteryRevenue: batRevenue,
        totalRevenue: genRevenue + batRevenue,
        socMwh,
        demandShortfallKwh,
      })
    }
  }

  // Capacity factor: actual gen / (peak * 8760)
  const totalRawKwh = genKwh.reduce((a, b) => a + b, 0)
  const capacityFactorPct = peakGenKwh > 0
    ? (totalRawKwh / (peakGenKwh * 8760)) * 100
    : 0

  const curtailmentPct = (totalRawKwh + totalCurtKwh) > 0
    ? (totalCurtKwh / (totalRawKwh + totalCurtKwh)) * 100
    : 0

  // Battery cycles: total discharged kWh / capacity
  const batteryTotalCycles = batteryConfig.enabled && batteryConfig.capacityMWh > 0
    ? batteryTotalKwh / (batteryConfig.capacityMWh * 1000)
    : 0

  const batteryUtilizationPct = batteryConfig.enabled && batteryConfig.capacityMWh > 0
    ? Math.min(100, (batteryTotalKwh / (batteryConfig.capacityMWh * 1000 * 365)) * 100)
    : 0

  return {
    annualGenerationRevenue: annualGenRevenue,
    annualBatteryRevenue: annualBatRevenue,
    annualTotalRevenue: annualGenRevenue + annualBatRevenue,
    totalGenerationKwh: totalGenKwh,
    totalCurtailedKwh: totalCurtKwh,
    curtailmentPct,
    capacityFactorPct,
    peakGenerationKwh: peakGenKwh,
    batteryTotalCycles,
    batteryUtilizationPct,
    monthly: buildMonthlyBreakdown(monthly),
    hourly,
  }
}
