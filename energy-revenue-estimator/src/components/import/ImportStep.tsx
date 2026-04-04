import { useImport } from '../../hooks/useImport'
import { useProjectStore } from '../../stores/projectStore'
import { FileUploader } from './FileUploader'
import { ExampleDataLoader } from './ExampleDataLoader'
import { ImportSummary } from './ImportSummary'
import { TimezoneSelector } from './TimezoneSelector'

export function ImportStep() {
  const gen = useImport('generation')
  const price = useImport('price')
  const generation = useProjectStore(s => s.generation)
  const priceMatrix = useProjectStore(s => s.price)
  const generationUtcOffset = useProjectStore(s => s.generationUtcOffset)
  const priceUtcOffset = useProjectStore(s => s.priceUtcOffset)
  const setGenerationUtcOffset = useProjectStore(s => s.setGenerationUtcOffset)
  const setPriceUtcOffset = useProjectStore(s => s.setPriceUtcOffset)
  const setActiveStep = useProjectStore(s => s.setActiveStep)

  const canProceed = generation !== null && priceMatrix !== null
  const tzMismatch = generation && priceMatrix && generationUtcOffset !== priceUtcOffset
  const tzShiftHours = generationUtcOffset - priceUtcOffset

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div>
        <h2 className="text-lg font-semibold text-[#111827] mb-1">Import Data</h2>
        <p className="text-sm text-[#4B5563]">
          Load hourly generation and price data. Supported formats: SAM vertical (8760-row),
          PVWatts hourly, LMP wide (days × HE1–HE24), and SAM wide (hours × days).
        </p>
      </div>

      {/* Generation */}
      <section>
        <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wide mb-3">
          Generation Data
        </h3>
        <div className="space-y-3">
          <ExampleDataLoader
            target="generation"
            onLoad={gen.importUrl}
            disabled={gen.status === 'loading'}
          />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center text-xs text-[#9CA3AF] uppercase">
              <span className="bg-[#F8F9FA] px-2">or upload your own</span>
            </div>
          </div>
          <FileUploader
            label="Drag & drop generation CSV"
            onFile={gen.importFile}
            status={gen.status}
          />
          {gen.error && <p className="text-sm text-[#DC2626]">✕ {gen.error}</p>}
          {generation && (
            <div className="space-y-2">
              <ImportSummary matrix={generation} label="Generation" />
              <TimezoneSelector
                label="Generation"
                value={generationUtcOffset}
                onChange={setGenerationUtcOffset}
              />
            </div>
          )}
        </div>
      </section>

      {/* Price */}
      <section>
        <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wide mb-3">
          Price Data
        </h3>
        <div className="space-y-3">
          <ExampleDataLoader
            target="price"
            onLoad={price.importUrl}
            disabled={price.status === 'loading'}
          />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center text-xs text-[#9CA3AF] uppercase">
              <span className="bg-[#F8F9FA] px-2">or upload your own</span>
            </div>
          </div>
          <FileUploader
            label="Drag & drop price CSV"
            onFile={price.importFile}
            status={price.status}
          />
          {price.error && <p className="text-sm text-[#DC2626]">✕ {price.error}</p>}
          {priceMatrix && (
            <div className="space-y-2">
              <ImportSummary matrix={priceMatrix} label="Price" />
              <TimezoneSelector
                label="Price"
                value={priceUtcOffset}
                onChange={setPriceUtcOffset}
              />
            </div>
          )}
        </div>
      </section>

      {/* Timezone mismatch notice */}
      {tzMismatch && (
        <div className="bg-[#FFFBEB] border-l-4 border-[#F59E0B] rounded-r-lg p-3 flex gap-2">
          <span className="text-[#F59E0B] mt-0.5">⚠</span>
          <div className="text-sm text-[#111827]">
            <span className="font-medium">Timezone mismatch detected.</span>{' '}
            Generation will be shifted{' '}
            <span className="font-medium">
              {Math.abs(tzShiftHours)} hour{Math.abs(tzShiftHours) !== 1 ? 's' : ''}{' '}
              {tzShiftHours > 0 ? 'earlier' : 'later'}
            </span>{' '}
            to align with price data before calculating revenue.
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={() => setActiveStep('configure')}
          disabled={!canProceed}
          className="px-5 py-2.5 bg-[#16A34A] text-white text-sm font-medium rounded-md
            hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue to Configure →
        </button>
      </div>
    </div>
  )
}
