import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { RevenueSummary } from '../../types/revenue'
import type { BatteryConfig } from '../../types/battery'
import { dayIndexToLabel } from '../../utils/formatters'

// Day index where each month starts (non-leap year)
const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props {
  summary: RevenueSummary
  cfg: BatteryConfig
}

interface DailyPoint {
  dayIndex: number
  label: string
  shortfallKwh: number
  shortfallHours: number
}

interface MonthRow {
  label: string
  violationDays: number
  shortfallKwh: number
  worstDayKwh: number
}

function fmtKwh(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)} MWh`
  return `${v.toFixed(0)} kWh`
}

export function DemandShortfallChart({ summary, cfg }: Props) {
  // Aggregate daily shortfall
  const daily: DailyPoint[] = Array.from({ length: 365 }, (_, d) => ({
    dayIndex: d,
    label: dayIndexToLabel(d),
    shortfallKwh: 0,
    shortfallHours: 0,
  }))

  for (const r of summary.hourly) {
    if (r.demandShortfallKwh > 0) {
      daily[r.dayIndex].shortfallKwh += r.demandShortfallKwh
      daily[r.dayIndex].shortfallHours += 1
    }
  }

  const violationDays = daily.filter(d => d.shortfallKwh > 0).length
  const totalShortfall = daily.reduce((s, d) => s + d.shortfallKwh, 0)

  // Monthly rollup
  const monthRows: MonthRow[] = MONTH_LABELS.map((label, m) => {
    const start = MONTH_STARTS[m]
    const end = m < 11 ? MONTH_STARTS[m + 1] : 365
    const slice = daily.slice(start, end)
    return {
      label,
      violationDays: slice.filter(d => d.shortfallKwh > 0).length,
      shortfallKwh: slice.reduce((s, d) => s + d.shortfallKwh, 0),
      worstDayKwh: Math.max(...slice.map(d => d.shortfallKwh)),
    }
  })

  // X-axis ticks at month boundaries
  const xTicks = MONTH_STARTS

  const tooltipFormatter = (value: number, _name: string, props: { payload?: DailyPoint }) => {
    const pt = props.payload
    if (!pt || value === 0) return null
    return [`${fmtKwh(value)} unmet over ${pt.shortfallHours} hr${pt.shortfallHours !== 1 ? 's' : ''}`, 'Shortfall']
  }

  const xTickFormatter = (dayIndex: number) => MONTH_LABELS[MONTH_STARTS.indexOf(dayIndex)] ?? ''

  return (
    <div className="bg-white border border-[#D1D5DB] rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            ⚠ Demand Shortfall — Contract Violations
          </h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Hours where solar&nbsp;+&nbsp;battery output fell below {cfg.demandThresholdKw} kW
            during {MONTH_LABELS[0]}–{MONTH_LABELS[11]} TOU window ({cfg.touStartHour}:00–{cfg.touEndHour}:00)
          </p>
        </div>
        <div className="flex gap-4 text-right shrink-0">
          <div>
            <div className={`text-lg font-bold tabular-nums ${violationDays > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
              {violationDays}
            </div>
            <div className="text-xs text-[#6B7280]">violation days</div>
          </div>
          <div>
            <div className={`text-lg font-bold tabular-nums ${totalShortfall > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
              {fmtKwh(totalShortfall)}
            </div>
            <div className="text-xs text-[#6B7280]">total unmet</div>
          </div>
        </div>
      </div>

      {violationDays === 0 ? (
        <div className="flex items-center justify-center py-8 text-[#16A34A] text-sm font-medium">
          ✓ No violations — demand threshold met on all 365 days
        </div>
      ) : (
        <>
          {/* Daily bar chart */}
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
              <XAxis
                dataKey="dayIndex"
                type="number"
                domain={[0, 364]}
                ticks={xTicks}
                tickFormatter={xTickFormatter}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
                width={42}
                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}MWh` : `${v}`}
              />
              <ReferenceLine y={0} stroke="#E5E7EB" />
              <Tooltip
                formatter={tooltipFormatter as never}
                labelFormatter={(_v, payload) => payload?.[0]?.payload?.label ?? ''}
                contentStyle={{ border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
              />
              <Bar dataKey="shortfallKwh" fill="#DC2626" radius={[1, 1, 0, 0]} maxBarSize={4} />
            </BarChart>
          </ResponsiveContainer>

          {/* Monthly summary table */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-1.5 px-2 text-[#4B5563] font-semibold uppercase tracking-wide">Month</th>
                  <th className="text-right py-1.5 px-2 text-[#4B5563] font-semibold uppercase tracking-wide">Violation Days</th>
                  <th className="text-right py-1.5 px-2 text-[#4B5563] font-semibold uppercase tracking-wide">Total Unmet</th>
                  <th className="text-right py-1.5 px-2 text-[#4B5563] font-semibold uppercase tracking-wide">Worst Day</th>
                </tr>
              </thead>
              <tbody>
                {monthRows.map((row, i) => (
                  <tr key={i} className={`border-b border-[#F3F4F6] ${row.violationDays > 0 ? 'bg-[#FEF2F2]' : ''}`}>
                    <td className="py-1.5 px-2 font-medium text-[#111827]">{row.label}</td>
                    <td className={`py-1.5 px-2 text-right tabular-nums font-medium ${row.violationDays > 0 ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}>
                      {row.violationDays > 0 ? row.violationDays : '—'}
                    </td>
                    <td className={`py-1.5 px-2 text-right tabular-nums ${row.shortfallKwh > 0 ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}>
                      {row.shortfallKwh > 0 ? fmtKwh(row.shortfallKwh) : '—'}
                    </td>
                    <td className={`py-1.5 px-2 text-right tabular-nums ${row.worstDayKwh > 0 ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}>
                      {row.worstDayKwh > 0 ? fmtKwh(row.worstDayKwh) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
