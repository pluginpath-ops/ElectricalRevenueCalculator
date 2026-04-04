import type { HourlyMatrix } from '../../types'
import { WarningBanner } from '../shared/WarningBanner'

const FORMAT_LABELS: Record<string, string> = {
  'sam-vertical': 'SAM Vertical',
  'pvwatts': 'PVWatts Hourly',
  'lmp-wide': 'LMP Wide (days × hours)',
  'sam-wide': 'SAM Wide (hours × days)',
}

interface Props {
  matrix: HourlyMatrix
  label: string
}

export function ImportSummary({ matrix, label }: Props) {
  const { meta } = matrix
  return (
    <div className="mt-3 p-3 bg-[#F0FDF4] border border-[#16A34A] rounded-lg text-sm">
      <div className="font-medium text-[#166534] mb-1">✓ {label} loaded</div>
      <div className="text-[#4B5563] space-y-0.5">
        <div>Source: <span className="font-medium">{meta.source}</span></div>
        <div>Format: <span className="font-medium">{FORMAT_LABELS[meta.format] ?? meta.format}</span></div>
        <div>Records: <span className="font-medium">{meta.recordCount.toLocaleString()}</span></div>
        <div>Unit: <span className="font-medium">{meta.unit}</span></div>
      </div>
      <WarningBanner warnings={meta.warnings} />
    </div>
  )
}
