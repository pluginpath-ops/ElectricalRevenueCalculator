import type { ValidationWarning } from '../../types'

interface Props {
  warnings: ValidationWarning[]
}

export function WarningBanner({ warnings }: Props) {
  if (warnings.length === 0) return null
  return (
    <div className="space-y-2 mt-3">
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`flex gap-2 p-2 rounded text-sm border-l-2 ${
            w.severity === 'error'
              ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
              : 'bg-[#FFFBEB] border-[#F59E0B] text-[#92400E]'
          }`}
        >
          <span>{w.severity === 'error' ? '✕' : '⚠'}</span>
          <span>{w.message}</span>
        </div>
      ))}
    </div>
  )
}
