import type { RevenueSummary } from '../../types/revenue'
import type { BatteryConfig } from '../../types/battery'
import { fmtDollar, fmtNumber, fmtPct } from '../../utils/formatters'
import { Tooltip } from '../shared/Tooltip'

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  tooltip?: string
  color?: string
}

function MetricCard({ label, value, sub, tooltip, color = '#111827' }: MetricCardProps) {
  return (
    <div className="bg-white border border-[#D1D5DB] rounded-lg p-4 min-w-[160px]">
      <div className="text-[28px] font-bold leading-none" style={{ color }}>{value}</div>
      <div className="flex items-center gap-1 mt-2">
        <span className="text-xs font-medium text-[#4B5563] uppercase tracking-wide">{label}</span>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      {sub && <div className="text-xs text-[#9CA3AF] mt-0.5">{sub}</div>}
    </div>
  )
}

interface Props {
  summary: RevenueSummary
  batteryEnabled: boolean
  batteryConfig?: BatteryConfig
}

export function SummaryCards({ summary, batteryEnabled, batteryConfig }: Props) {
  const showDemandReduction = batteryEnabled &&
    batteryConfig?.strategy === 'peak-shaving' &&
    (batteryConfig?.demandReductionRate ?? 0) > 0

  // Annual Revenue sub-label: show breakdown when multiple revenue streams are active
  const annualRevSub = batteryEnabled
    ? showDemandReduction
      ? `Gen: ${fmtDollar(summary.annualGenerationRevenue)} · Bat: ${fmtDollar(summary.annualBatteryRevenue)}`
      : `Gen: ${fmtDollar(summary.annualGenerationRevenue)}`
    : undefined

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard
        label="Annual Revenue"
        value={fmtDollar(summary.annualTotalRevenue)}
        sub={annualRevSub}
        tooltip="Total revenue from generation (and battery / demand reduction if enabled) across all 8,760 hours"
        color="#111827"
      />
      {batteryEnabled && (
        <MetricCard
          label="Battery Revenue"
          value={fmtDollar(summary.annualBatteryRevenue)}
          sub={`${fmtNumber(summary.batteryTotalCycles, 1)} cycles`}
          tooltip="Net revenue from battery arbitrage (discharge revenue minus charge cost)"
          color="#06B6D4"
        />
      )}
      {showDemandReduction && (
        <MetricCard
          label="Demand Reduction"
          value={fmtDollar(summary.annualDemandReductionRevenue)}
          sub={`$${batteryConfig!.demandReductionRate}/kW · per ${batteryConfig!.demandReductionPeriod}`}
          tooltip="Capacity payment earned for periods where output met the demand threshold on every hour of the TOU window"
          color="#16A34A"
        />
      )}
      <MetricCard
        label="Capacity Factor"
        value={fmtPct(summary.capacityFactorPct)}
        tooltip="Annual generation as a fraction of peak power × 8,760 hours"
        color="#F59E0B"
      />
      <MetricCard
        label="Curtailment"
        value={fmtPct(summary.curtailmentPct)}
        sub={`${fmtNumber(summary.totalCurtailedKwh / 1000, 1)} MWh`}
        tooltip="Generation curtailed during negative-price hours"
        color={summary.curtailmentPct > 5 ? '#DC2626' : '#111827'}
      />
      <MetricCard
        label="Total Generation"
        value={`${fmtNumber(summary.totalGenerationKwh / 1000, 0)} MWh`}
        tooltip="Total delivered generation across the year"
        color="#111827"
      />
    </div>
  )
}
