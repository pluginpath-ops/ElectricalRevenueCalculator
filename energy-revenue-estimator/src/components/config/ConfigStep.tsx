import { useProjectStore } from '../../stores/projectStore'
import { BatteryPanel } from './BatteryPanel'
import { GenerationScaler } from './GenerationScaler'

export function ConfigStep() {
  const setActiveStep = useProjectStore(s => s.setActiveStep)

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <div>
        <h2 className="text-lg font-semibold text-[#111827] mb-1">Configure</h2>
        <p className="text-sm text-[#4B5563]">
          Adjust system parameters. Results update automatically.
        </p>
      </div>

      <BatteryPanel />
      <GenerationScaler />

      <div className="flex justify-between pt-2">
        <button
          onClick={() => setActiveStep('import')}
          className="px-4 py-2 text-sm text-[#4B5563] border border-[#D1D5DB] rounded-md
            hover:border-[#9CA3AF]"
        >
          ← Back to Import
        </button>
        <button
          onClick={() => setActiveStep('results')}
          className="px-5 py-2.5 bg-[#16A34A] text-white text-sm font-medium rounded-md
            hover:bg-[#15803D]"
        >
          View Results →
        </button>
      </div>
    </div>
  )
}
