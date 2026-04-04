import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { RevenueSummary } from '../../types/revenue'
import { useChartInteraction } from '../../hooks/useChartInteraction'
import { dayIndexToLabel, formatHour } from '../../utils/formatters'

interface Props {
  summary: RevenueSummary
}

const CHART_HEIGHT = 200
const MARGIN = { top: 4, right: 52, left: 0, bottom: 0 }

/** Make a Y-axis domain symmetric around 0 so zero always sits at mid-chart. */
function symDomain(vals: number[]): [number, number] {
  const absMax = Math.max(...vals.map(Math.abs), 0.01)
  return [-absMax, absMax]
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#D1D5DB] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[#111827] mb-3">{title}</h3>
      {children}
    </div>
  )
}

export function LineByDay({ summary }: Props) {
  const selectedDay = useChartInteraction(s => s.selectedDay)

  if (selectedDay === null) {
    return (
      <div className="bg-white border border-[#D1D5DB] rounded-lg p-4 flex items-center
        justify-center" style={{ minHeight: 200 }}>
        <p className="text-sm text-[#9CA3AF] text-center">Click a day column on the heatmap to inspect</p>
      </div>
    )
  }

  const dayRecords = summary.hourly.filter(r => r.dayIndex === selectedDay)
  const hasBattery = dayRecords.some(r => r.batteryDischargeKwh > 0 || r.batteryChargeKwh > 0)
  const label = dayIndexToLabel(selectedDay)

  const genData = dayRecords.map(r => ({
    hour: formatHour(r.hour),
    'Gen (kWh)': parseFloat(r.generationKwh.toFixed(2)),
    'Price ($/MWh)': parseFloat(r.priceDollarsPerMwh.toFixed(2)),
    'Gen Rev ($)': parseFloat(r.generationRevenue.toFixed(3)),
  }))

  const batData = dayRecords.map(r => ({
    hour: formatHour(r.hour),
    // Positive = discharge, negative = charge — single line
    'Power (kWh)': parseFloat((r.batteryDischargeKwh - r.batteryChargeKwh).toFixed(2)),
    'SOC (MWh)': parseFloat(r.socMwh.toFixed(3)),
    'Bat Rev ($)': parseFloat(r.batteryRevenue.toFixed(3)),
  }))

  const priceDomain = symDomain(genData.map(d => d['Price ($/MWh)']))
  const genRevDomain = symDomain(genData.map(d => d['Gen Rev ($)']))
  const powerDomain = symDomain(batData.map(d => d['Power (kWh)']))
  const batRevDomain = symDomain(batData.map(d => d['Bat Rev ($)']))

  return (
    <div className="space-y-4">
      {/* Generation chart */}
      <Card title={`Generation — ${label}`}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={genData} margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#4B5563' }} axisLine={false} tickLine={false} interval={2} />
            <YAxis
              yAxisId="gen"
              tick={{ fontSize: 10, fill: '#4B5563' }}
              axisLine={false} tickLine={false} width={40}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              domain={priceDomain}
              tick={{ fontSize: 10, fill: '#8B5CF6' }}
              axisLine={false} tickLine={false} width={44}
              tickFormatter={v => `$${v}`}
            />
            <YAxis
              yAxisId="rev"
              orientation="right"
              domain={genRevDomain}
              tick={{ fontSize: 10, fill: '#16A34A' }}
              axisLine={false} tickLine={false} width={44}
              tickFormatter={v => `$${v}`}
            />
            {/* Zero line rendered on the price axis (symmetric, so zero is centred) */}
            <ReferenceLine yAxisId="price" y={0} stroke="#9CA3AF" strokeWidth={1} />
            <Tooltip contentStyle={{ border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
            <Line yAxisId="gen"   type="monotone"  dataKey="Gen (kWh)"    stroke="#F59E0B" dot={false} strokeWidth={1.5} />
            <Line yAxisId="price" type="stepAfter"  dataKey="Price ($/MWh)" stroke="#8B5CF6" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
            <Line yAxisId="rev"   type="monotone"  dataKey="Gen Rev ($)"   stroke="#16A34A" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Battery chart — only when battery was active this day */}
      {hasBattery && (
        <Card title={`Battery — ${label}`}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={batData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#4B5563' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis
                yAxisId="power"
                domain={powerDomain}
                tick={{ fontSize: 10, fill: '#F97316' }}
                axisLine={false} tickLine={false} width={40}
              />
              <YAxis
                yAxisId="soc"
                orientation="right"
                tick={{ fontSize: 10, fill: '#06B6D4' }}
                axisLine={false} tickLine={false} width={44}
                tickFormatter={v => `${v}`}
              />
              <YAxis
                yAxisId="rev"
                orientation="right"
                domain={batRevDomain}
                tick={{ fontSize: 10, fill: '#16A34A' }}
                axisLine={false} tickLine={false} width={44}
                tickFormatter={v => `$${v}`}
              />
              {/* Zero line — power axis is symmetric so zero is always centred */}
              <ReferenceLine yAxisId="power" y={0} stroke="#9CA3AF" strokeWidth={1} />
              <Tooltip contentStyle={{ border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              <Line yAxisId="power" type="stepAfter" dataKey="Power (kWh)" stroke="#F97316" dot={false} strokeWidth={1.5} />
              <Line yAxisId="soc"   type="monotone"  dataKey="SOC (MWh)"   stroke="#06B6D4" dot={false} strokeWidth={1.5} />
              <Line yAxisId="rev"   type="monotone"  dataKey="Bat Rev ($)"  stroke="#16A34A" dot={false} strokeWidth={1.5} strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
