import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import type { HourlyMatrix } from '../../types/timeseries'
import { matrixGet } from '../../types/timeseries'
import { dayIndexToLabel, formatHour } from '../../utils/formatters'
import { useChartInteraction } from '../../hooks/useChartInteraction'

const MONTH_DAY_OFFSET = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type ColorScale = 'generation' | 'price' | 'revenue'

interface ColorResult { r: number; g: number; b: number }

function generationColor(t: number): ColorResult {
  return {
    r: Math.round(255 * (0.98 + 0.02 * t)),
    g: Math.round(255 * (0.98 - 0.41 * t)),
    b: Math.round(255 * (0.98 - 0.94 * t)),
  }
}

function divergingColor(t: number): ColorResult {
  if (t < 0.5) {
    const s = 1 - t * 2
    return { r: Math.round(255 * (1 - 0.82 * s)), g: Math.round(255 * (1 - 0.72 * s)), b: 255 }
  } else {
    const s = (t - 0.5) * 2
    return { r: 255, g: Math.round(255 * (1 - 0.83 * s)), b: Math.round(255 * (1 - 0.87 * s)) }
  }
}

function revenueColor(t: number): ColorResult {
  return {
    r: Math.round(255 - 235 * t),
    g: Math.round(255 - 148 * t),
    b: Math.round(255 - 203 * t),
  }
}

function getColor(value: number, scaleMin: number, scaleMax: number, scale: ColorScale): ColorResult {
  if (isNaN(value)) return { r: 230, g: 230, b: 230 }
  if (scale === 'generation') {
    const t = scaleMax > 0 ? Math.max(0, Math.min(1, value / scaleMax)) : 0
    return generationColor(t)
  } else if (scale === 'revenue') {
    const t = scaleMax > 0 ? Math.max(0, Math.min(1, value / scaleMax)) : 0
    return revenueColor(t)
  } else {
    const absMax = Math.max(Math.abs(scaleMin), Math.abs(scaleMax), 1)
    const t = 0.5 + 0.5 * Math.max(-1, Math.min(1, value / absMax))
    return divergingColor(t)
  }
}

/** Compute p-th percentile (0–1) from a sorted array */
function pct(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))]
}

interface TooltipInfo { x: number; y: number; dayIndex: number; hour: number; value: number }

interface Props {
  matrix: HourlyMatrix
  scale?: ColorScale
  title?: string
  selectedVariable?: 'generation' | 'price' | 'revenue'
  onVariableChange?: (v: 'generation' | 'price' | 'revenue') => void
}

const Y_AXIS_WIDTH = 40
const X_AXIS_HEIGHT = 20
const TOP_PAD = 4

function fmtLegend(v: number, unit: string): string {
  if (unit === '$') return `$${v >= 100 ? v.toFixed(0) : v.toFixed(2)}`
  if (unit === '$/MWh') return `${v >= 0 ? '' : ''}${v.toFixed(0)} $/MWh`
  // kWh or other
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${unit}`
}

export function IntensityHeatmap({ matrix, scale = 'generation', title, selectedVariable, onVariableChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [capPct, setCapPct] = useState(99)
  const { setSelectedDay } = useChartInteraction()

  // Collect sorted finite values once per matrix change
  const sortedVals = useMemo(() => {
    const vals: number[] = []
    for (let d = 0; d < 365; d++) {
      for (let h = 0; h < 24; h++) {
        const v = matrixGet(matrix, d, h)
        if (!isNaN(v) && isFinite(v)) vals.push(v)
      }
    }
    return vals.sort((a, b) => a - b)
  }, [matrix])

  const { scaleMin, scaleMax } = useMemo(() => {
    if (sortedVals.length === 0) return { scaleMin: 0, scaleMax: 1 }
    const p = capPct / 100
    if (scale === 'price') {
      const absVals = sortedVals.map(Math.abs).sort((a, b) => a - b)
      const cap = pct(absVals, p)
      return { scaleMin: -cap, scaleMax: cap }
    }
    const cap = pct(sortedVals, p)
    return { scaleMin: 0, scaleMax: Math.max(cap, 0.01) }
  }, [sortedVals, capPct, scale])

  const unit = matrix.meta.unit

  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const totalW = container.clientWidth
    const totalH = container.clientHeight || 220

    canvas.width = totalW
    canvas.height = totalH

    const plotW = totalW - Y_AXIS_WIDTH
    const plotH = totalH - X_AXIS_HEIGHT - TOP_PAD

    const cellW = plotW / 365
    const cellH = plotH / 24

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, totalW, totalH)

    // Draw cells
    for (let d = 0; d < 365; d++) {
      for (let h = 0; h < 24; h++) {
        const v = matrixGet(matrix, d, h)
        const { r, g, b } = getColor(v, scaleMin, scaleMax, scale)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        const x = Y_AXIS_WIDTH + d * cellW
        const y = TOP_PAD + h * cellH
        ctx.fillRect(x, y, Math.ceil(cellW) + 0.5, Math.ceil(cellH) + 0.5)
      }
    }

    // Y-axis hour tick labels
    ctx.fillStyle = '#4B5563'
    ctx.font = '10px system-ui, sans-serif'
    ctx.textAlign = 'right'
    for (let h = 0; h < 24; h += 3) {
      const y = TOP_PAD + h * cellH + cellH / 2
      ctx.fillText(formatHour(h), Y_AXIS_WIDTH - 3, y + 3)
    }

    // X-axis month labels
    ctx.textAlign = 'left'
    ctx.fillStyle = '#4B5563'
    ctx.font = '10px system-ui, sans-serif'
    for (let m = 0; m < 12; m++) {
      const x = Y_AXIS_WIDTH + MONTH_DAY_OFFSET[m] * cellW
      ctx.fillText(MONTH_LABELS[m], x + 2, totalH - 4)
    }
  }, [matrix, scaleMin, scaleMax, scale])

  useEffect(() => { drawHeatmap() }, [drawHeatmap])

  useEffect(() => {
    const obs = new ResizeObserver(drawHeatmap)
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [drawHeatmap])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const plotW = canvas.width - Y_AXIS_WIDTH
    const plotH = canvas.height - X_AXIS_HEIGHT - TOP_PAD
    const dayIndex = Math.floor((x - Y_AXIS_WIDTH) / (plotW / 365))
    const hour = Math.floor((y - TOP_PAD) / (plotH / 24))
    if (dayIndex < 0 || dayIndex >= 365 || hour < 0 || hour >= 24) {
      setTooltip(null); return
    }
    const value = matrixGet(matrix, dayIndex, hour)
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, dayIndex, hour, value })
  }, [matrix])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const plotW = canvas.width - Y_AXIS_WIDTH
    const dayIndex = Math.floor((e.clientX - rect.left - Y_AXIS_WIDTH) / (plotW / 365))
    if (dayIndex >= 0 && dayIndex < 365) setSelectedDay(dayIndex)
  }, [setSelectedDay])

  // Legend label strings
  const legendLow  = scale === 'price' ? fmtLegend(-Math.abs(scaleMax), unit) : fmtLegend(0, unit)
  const legendHigh = scale === 'price' ? fmtLegend(Math.abs(scaleMax), unit)  : fmtLegend(scaleMax, unit)

  return (
    <div className="bg-white border border-[#D1D5DB] rounded-lg p-4">
      {title && (
        <div className="mb-3 space-y-2">
          {/* Title row */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">
                {title}{selectedVariable ? ` — ${selectedVariable.charAt(0).toUpperCase() + selectedVariable.slice(1)}` : ''}
              </h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Hours of day (rows) × Days of year (columns)</p>
            </div>
            <div className="text-xs text-[#9CA3AF] pt-0.5">Click column to inspect day</div>
          </div>

          {/* Variable buttons + percentile slider — all left-aligned */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Variable selector */}
            {onVariableChange && (
              <div className="flex gap-1">
                {(['generation', 'price', 'revenue'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => onVariableChange(v)}
                    className={`px-3 py-1 text-xs rounded-md border transition-colors capitalize ${
                      selectedVariable === v
                        ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-medium'
                        : 'border-[#D1D5DB] text-[#4B5563] hover:border-[#9CA3AF]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            {/* Percentile cap slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#4B5563] whitespace-nowrap">Scale cap</span>
              <input
                type="range"
                min={80}
                max={100}
                step={1}
                value={capPct}
                onChange={e => setCapPct(Number(e.target.value))}
                className="w-24 h-1 accent-[#2563EB] cursor-pointer"
              />
              <span className="text-xs text-[#4B5563] tabular-nums w-10">{capPct}th pct</span>
            </div>
          </div>
        </div>
      )}

      {/* Canvas with rotated Y-axis title */}
      <div className="flex gap-1">
        {/* Y-axis title */}
        <div className="flex items-center justify-center" style={{ width: 14 }}>
          <span
            className="text-[10px] text-[#9CA3AF] whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Hour of Day
          </span>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="relative flex-1" style={{ height: 220 }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
            onClick={handleClick}
          />
          {tooltip && (
            <div
              className="absolute z-10 bg-white border border-[#D1D5DB] rounded shadow-md
                text-xs px-2 py-1.5 pointer-events-none"
              style={{
                left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth ?? 400) - 160),
                top: Math.max(0, tooltip.y - 40),
              }}
            >
              <div className="font-medium">{dayIndexToLabel(tooltip.dayIndex)}, {formatHour(tooltip.hour)}</div>
              <div className="text-[#4B5563]">
                {isNaN(tooltip.value) ? '—' : fmtLegend(tooltip.value, unit)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Color scale legend with actual values */}
      <div className="flex items-center gap-2 mt-2 ml-4">
        <span className="text-xs text-[#6B7280] tabular-nums">{legendLow}</span>
        <div
          className="flex-1 h-2 rounded"
          style={{
            background:
              scale === 'generation'
                ? 'linear-gradient(to right, #FFFBE8, #F59E0B, #78350F)'
                : scale === 'revenue'
                  ? 'linear-gradient(to right, #ffffff, #16A34A, #14532D)'
                  : 'linear-gradient(to right, #2563EB, white, #DC2626)',
          }}
        />
        <span className="text-xs text-[#6B7280] tabular-nums">{legendHigh}</span>
      </div>
    </div>
  )
}
