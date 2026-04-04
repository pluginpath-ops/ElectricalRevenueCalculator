import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { RevenueSummary } from '../../types/revenue'
import { formatHour, fmtDollar } from '../../utils/formatters'

interface Props {
  summary: RevenueSummary
}

function isWeekday(dayIndex: number): boolean {
  const dow = (dayIndex + 0) % 7  // Jan 1 2023 = Sun
  return dow >= 1 && dow <= 5
}

export function HourlyAverages({ summary }: Props) {
  const data = useMemo(() => {
    const wdSum = new Float64Array(24)
    const weSum = new Float64Array(24)
    const wdCount = new Int32Array(24)
    const weCount = new Int32Array(24)

    for (const r of summary.hourly) {
      if (isWeekday(r.dayIndex)) {
        wdSum[r.hour] += r.totalRevenue
        wdCount[r.hour]++
      } else {
        weSum[r.hour] += r.totalRevenue
        weCount[r.hour]++
      }
    }

    return Array.from({ length: 24 }, (_, h) => ({
      hour: formatHour(h),
      Weekday: wdCount[h] > 0 ? wdSum[h] / wdCount[h] : 0,
      Weekend: weCount[h] > 0 ? weSum[h] / weCount[h] : 0,
    }))
  }, [summary])

  return (
    <div className="bg-white border border-[#D1D5DB] rounded-lg p-4">
      <h3 className="text-[15px] font-semibold text-[#111827] mb-3">
        Avg Hourly Revenue — Weekday vs. Weekend
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: '#4B5563' }}
            interval={2}
          />
          <YAxis
            tickFormatter={v => fmtDollar(v, 2)}
            tick={{ fontSize: 11, fill: '#4B5563' }}
            width={52}
          />
          <Tooltip
            formatter={(v) => fmtDollar(Number(v ?? 0), 3)}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Weekday" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Weekend" fill="#06B6D4" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
