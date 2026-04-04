/** One row of hourly results */
export interface HourlyRevenueRecord {
  dayIndex: number
  hour: number
  /** kWh — after scaling */
  generationKwh: number
  /** kWh — dispatched from battery (positive) */
  batteryDischargeKwh: number
  /** kWh — consumed by battery for charging (positive magnitude) */
  batteryChargeKwh: number
  /** kWh — consumed by battery or curtailed */
  curtailedKwh: number
  /** $/MWh */
  priceDollarsPerMwh: number
  /** $ — generation revenue (may be 0 if curtailed) */
  generationRevenue: number
  /** $ — battery net revenue */
  batteryRevenue: number
  /** $ — total */
  totalRevenue: number
  /** Battery SOC at end of hour MWh */
  socMwh: number
}

export interface MonthlyBreakdown {
  month: number  // 1–12
  label: string  // 'Jan', 'Feb', ...
  generationRevenue: number
  batteryRevenue: number
  totalRevenue: number
  generationKwh: number
  curtailedKwh: number
}

export interface RevenueSummary {
  annualGenerationRevenue: number
  annualBatteryRevenue: number
  annualTotalRevenue: number
  totalGenerationKwh: number
  totalCurtailedKwh: number
  curtailmentPct: number
  capacityFactorPct: number
  /** Peak generation kWh in any single hour */
  peakGenerationKwh: number
  batteryTotalCycles: number
  batteryUtilizationPct: number
  monthly: MonthlyBreakdown[]
  hourly: HourlyRevenueRecord[]
}
