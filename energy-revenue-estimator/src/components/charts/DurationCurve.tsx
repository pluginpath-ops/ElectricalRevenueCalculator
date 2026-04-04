import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { RevenueSummary } from '../../types/revenue'

interface Props {
  summary: RevenueSummary
}

export function DurationCurve({ summary }: Props) {
  const sorted = [...summary.hourly]
    .map(r => r.priceDollarsPerMwh)
    .sort((a, b) => b - a)

  const data = sorted.map((price, i) => ({
    pct: parseFloat(((i / 8760) * 100).toFixed(2)),
    price: parseFloat(price.toFixed(2)),
  })).filter((_, i) => i % 36 === 0) // ~243 points

  return (
    <div className="bg-white border border-[#D1D5DB] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[#111827] mb-3">Price Duration Curve</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
          <XAxis
            dataKey="pct"
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 10, fill: '#4B5563' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `$${v}`}
            tick={{ fontSize: 10, fill: '#4B5563' }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            formatter={(v) => [`$${Number(v).toFixed(2)}/MWh`, 'Price']}
            labelFormatter={v => `${v}% of hours`}
            contentStyle={{ border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#8B5CF6"
            fill="#EDE9FE"
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
