import { useMemo, useEffect } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { SummaryCards } from './SummaryCards'
import { MonthlyBreakdown } from './MonthlyBreakdown'
import { ScenarioCompare } from './ScenarioCompare'
import { IntensityHeatmap } from '../charts/IntensityHeatmap'
import { LineByDay } from '../charts/LineByDay'
import { DurationCurve } from '../charts/DurationCurve'
import { HourlyAverages } from '../charts/HourlyAverages'
import { DemandShortfallChart } from '../charts/DemandShortfallChart'
import { ChartErrorBoundary } from '../shared/ChartErrorBoundary'
import { useChartInteraction } from '../../hooks/useChartInteraction'
import { exportHourlyCsv } from '../../utils/exportCsv'
import { encodeUrlState } from '../../utils/urlState'
import type { HourlyMatrix } from '../../types'

export function ResultsStep() {
  const results = useProjectStore(s => s.results)
  const isCalculating = useProjectStore(s => s.isCalculating)
  const generation = useProjectStore(s => s.generation)
  const price = useProjectStore(s => s.price)
  const batteryConfig = useProjectStore(s => s.batteryConfig)
  const scalingFactor = useProjectStore(s => s.scalingFactor)
  const setActiveStep = useProjectStore(s => s.setActiveStep)
  const selectedVariable = useChartInteraction(s => s.selectedVariable)
  const setSelectedVariable = useChartInteraction(s => s.setSelectedVariable)

  // Sync config to URL whenever it changes
  useEffect(() => {
    encodeUrlState(batteryConfig, scalingFactor)
  }, [batteryConfig, scalingFactor])

  if (!generation || !price) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[#4B5563] mb-3">No data imported yet.</p>
        <button
          onClick={() => setActiveStep('import')}
          className="text-[#2563EB] text-sm underline"
        >
          Go to Import →
        </button>
      </div>
    )
  }

  if (isCalculating) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-[#4B5563]">Calculating…</span>
      </div>
    )
  }

  if (!results) return null

  // Derive revenue matrix for heatmap
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const revenueMatrix = useMemo<HourlyMatrix | null>(() => {
    const values = new Float64Array(365 * 24)
    for (const r of results.hourly) {
      values[r.dayIndex * 24 + r.hour] = r.totalRevenue
    }
    return { values, meta: { ...generation.meta, unit: '$', source: 'computed' } }
  }, [results, generation])

  const heatmapMatrix =
    selectedVariable === 'generation' ? generation
    : selectedVariable === 'revenue' ? (revenueMatrix ?? price)
    : price
  const heatmapScale: 'generation' | 'price' | 'revenue' =
    selectedVariable === 'generation' ? 'generation'
    : selectedVariable === 'revenue' ? 'revenue'
    : 'price'

  return (
    <div className="space-y-5 py-6">
      {/* Top bar */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <button
          onClick={() => setActiveStep('configure')}
          className="text-sm text-[#4B5563] hover:text-[#111827]"
        >
          ← Configure
        </button>
        <button
          onClick={() => exportHourlyCsv(results)}
          className="px-3 py-1 text-xs rounded-md border border-[#D1D5DB] text-[#4B5563]
            hover:border-[#9CA3AF] flex items-center gap-1"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <SummaryCards summary={results} batteryEnabled={batteryConfig.enabled} />

      {/* Heatmap + day drill-down (always stacked) */}
      <ChartErrorBoundary label="Hour × Day Grid">
        <IntensityHeatmap
          matrix={heatmapMatrix}
          scale={heatmapScale}
          title="Hour × Day Grid"
          selectedVariable={selectedVariable}
          onVariableChange={setSelectedVariable}
        />
      </ChartErrorBoundary>
      <ChartErrorBoundary label="24-Hour Profile">
        <LineByDay summary={results} batteryConfig={batteryConfig} />
      </ChartErrorBoundary>

      {/* Demand shortfall — only relevant for peak-shaving strategy */}
      {batteryConfig.enabled && batteryConfig.strategy === 'peak-shaving' && (
        <ChartErrorBoundary label="Demand Shortfall">
          <DemandShortfallChart summary={results} cfg={batteryConfig} />
        </ChartErrorBoundary>
      )}

      {/* Monthly breakdown + duration curve */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartErrorBoundary label="Monthly Breakdown">
          <MonthlyBreakdown summary={results} batteryEnabled={batteryConfig.enabled} />
        </ChartErrorBoundary>
        <ChartErrorBoundary label="Duration Curve">
          <DurationCurve summary={results} />
        </ChartErrorBoundary>
      </div>

      {/* Hourly averages */}
      <ChartErrorBoundary label="Hourly Averages">
        <HourlyAverages summary={results} />
      </ChartErrorBoundary>

      {/* Scenario compare */}
      <ScenarioCompare />
    </div>
  )
}
