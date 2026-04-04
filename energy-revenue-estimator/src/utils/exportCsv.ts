import type { RevenueSummary } from '../types/revenue'
import { dayIndexToLabel, formatHour } from './formatters'

export function exportHourlyCsv(summary: RevenueSummary): void {
  const headers = [
    'Date', 'Hour',
    'Generation (kWh)', 'Battery Discharge (kWh)', 'Curtailed (kWh)',
    'Price ($/MWh)', 'Generation Revenue ($)', 'Battery Revenue ($)', 'Total Revenue ($)',
    'Battery SOC (MWh)',
  ]

  const rows = summary.hourly.map(r => [
    dayIndexToLabel(r.dayIndex),
    formatHour(r.hour),
    r.generationKwh.toFixed(3),
    r.batteryDischargeKwh.toFixed(3),
    r.curtailedKwh.toFixed(3),
    r.priceDollarsPerMwh.toFixed(2),
    r.generationRevenue.toFixed(2),
    r.batteryRevenue.toFixed(2),
    r.totalRevenue.toFixed(2),
    r.socMwh.toFixed(3),
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'energy_revenue_hourly.csv'
  a.click()
  URL.revokeObjectURL(url)
}
