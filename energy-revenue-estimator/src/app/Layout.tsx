import type { ReactNode } from 'react'
import { useProjectStore } from '../stores/projectStore'
import type { AppStep } from '../types/project'

interface StepDef {
  id: AppStep
  label: string
  shortLabel: string
}

const STEPS: StepDef[] = [
  { id: 'import', label: 'Import Data', shortLabel: 'Import' },
  { id: 'configure', label: 'Configure', shortLabel: 'Config' },
  { id: 'results', label: 'Results', shortLabel: 'Results' },
]

interface Props {
  children: ReactNode
}

export function Layout({ children }: Props) {
  const activeStep = useProjectStore(s => s.activeStep)
  const setActiveStep = useProjectStore(s => s.setActiveStep)
  const generation = useProjectStore(s => s.generation)
  const price = useProjectStore(s => s.price)
  const results = useProjectStore(s => s.results)

  const isStepComplete = (step: AppStep) => {
    if (step === 'import') return generation !== null && price !== null
    if (step === 'configure') return results !== null
    return false
  }

  const isStepAccessible = (step: AppStep) => {
    if (step === 'import') return true
    if (step === 'configure') return generation !== null && price !== null
    if (step === 'results') return results !== null
    return false
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-[200px] min-w-[200px] bg-white border-r border-[#D1D5DB] flex flex-col py-5 px-3">
        <div className="mb-6 px-2">
          <h1 className="text-sm font-bold text-[#111827] leading-tight">
            Energy Revenue<br />Estimator
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">Merchant generation analysis</p>
        </div>

        <nav className="flex flex-col gap-1">
          {STEPS.map((step, i) => {
            const complete = isStepComplete(step.id)
            const accessible = isStepAccessible(step.id)
            const active = activeStep === step.id

            return (
              <button
                key={step.id}
                onClick={() => accessible && setActiveStep(step.id)}
                disabled={!accessible}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-left
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  ${active
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-medium'
                    : accessible
                      ? 'text-[#4B5563] hover:bg-[#F8F9FA] hover:text-[#111827]'
                      : 'text-[#9CA3AF]'
                  }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold shrink-0
                    ${complete
                      ? 'bg-[#16A34A] text-white'
                      : active
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#E5E7EB] text-[#6B7280]'
                    }`}
                >
                  {complete ? '✓' : i + 1}
                </span>
                {step.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-[#E5E7EB] px-2">
          <p className="text-xs text-[#9CA3AF]">
            All calculations run in your browser. No data leaves your device.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#F8F9FA]">
        <div className="max-w-[1400px] mx-auto px-6">
          {children}
        </div>
      </main>
    </div>
  )
}
