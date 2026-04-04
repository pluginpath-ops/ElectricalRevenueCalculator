import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { RevenueSummary } from '../../types/revenue'
import { fmtDollar, fmtNumber } from '../../utils/formatters'

interface Props {
  summary: RevenueSummary
  batteryEnabled: boolean
}

export function MonthlyBreakdown({ summary, batteryEnabled }: Props) {
  const data = summary.monthly.map(m => ({
    name: m.label,
    'Generation': Math.round(m.generationRevenue),
    'Battery': Math.round(m.batteryRevenue),
  }))

  return (
    <div className="bg-white border border-[#D1D5DB] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Monthly Revenue Breakdown</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#4B5563' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12, fill: '#4B5563' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(v) => fmtDollar(Number(v))}
            contentStyle={{
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '13px' }} />
          <Bar dataKey="Generation" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
          {batteryEnabled && (
            <Bar dataKey="Battery" stackId="a" fill="#06B6D4" radius={[3, 3, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F1F3F5] border-t-2 border-b-2 border-[#D1D5DB]">
              <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">Month</th>
              <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">Generation Revenue</th>
              {batteryEnabled && <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">Battery Revenue</th>}
              <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">Total</th>
              <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4B5563]">Generation (MWh)</th>
            </tr>
          </thead>
          <tbody>
            {summary.monthly.map((m, i) => (
              <tr key={m.label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}>
                <td className="px-3 py-2 font-medium">{m.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtDollar(m.generationRevenue)}</td>
                {batteryEnabled && <td className="px-3 py-2 text-right tabular-nums">{fmtDollar(m.batteryRevenue)}</td>}
                <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtDollar(m.totalRevenue)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[#4B5563]">{fmtNumber(m.generationKwh / 1000, 1)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#D1D5DB] font-semibold">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtDollar(summary.annualGenerationRevenue)}</td>
              {batteryEnabled && <td className="px-3 py-2 text-right tabular-nums">{fmtDollar(summary.annualBatteryRevenue)}</td>}
              <td className="px-3 py-2 text-right tabular-nums">{fmtDollar(summary.annualTotalRevenue)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-[#4B5563]">{fmtNumber(summary.totalGenerationKwh / 1000, 1)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
