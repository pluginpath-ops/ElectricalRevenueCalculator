import { create } from 'zustand'
import type { HourlyMatrix } from '../types/timeseries'
import type { BatteryConfig } from '../types/battery'
import type { RevenueSummary } from '../types/revenue'
import type { AppStep, ProjectState, Scenario } from '../types/project'
import { DEFAULT_BATTERY_CONFIG } from '../types/battery'

interface ProjectActions {
  setGeneration: (m: HourlyMatrix | null) => void
  setPrice: (m: HourlyMatrix | null) => void
  setGenerationUtcOffset: (offset: number) => void
  setPriceUtcOffset: (offset: number) => void
  setBatteryConfig: (cfg: Partial<BatteryConfig>) => void
  setScalingFactor: (f: number) => void
  setActiveStep: (s: AppStep) => void
  setResults: (r: RevenueSummary | null) => void
  setIsCalculating: (v: boolean) => void
  saveScenario: (name: string) => void
  deleteScenario: (id: string) => void
  reset: () => void
}

const initialState: ProjectState = {
  generation: null,
  price: null,
  generationUtcOffset: -6,  // default Central
  priceUtcOffset: -6,        // default Central
  batteryConfig: DEFAULT_BATTERY_CONFIG,
  scalingFactor: 1.0,
  activeStep: 'import',
  results: null,
  isCalculating: false,
  scenarios: [],
}

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
  ...initialState,

  setGeneration: (m) => set({ generation: m }),
  setPrice: (m) => set({ price: m }),
  setGenerationUtcOffset: (offset) => set({ generationUtcOffset: offset }),
  setPriceUtcOffset: (offset) => set({ priceUtcOffset: offset }),
  setBatteryConfig: (cfg) =>
    set(s => ({ batteryConfig: { ...s.batteryConfig, ...cfg } })),
  setScalingFactor: (f) => set({ scalingFactor: f }),
  setActiveStep: (s) => set({ activeStep: s }),
  setResults: (r) => set({ results: r }),
  setIsCalculating: (v) => set({ isCalculating: v }),

  saveScenario: (name) => {
    const { batteryConfig, scalingFactor, results } = get()
    if (!results) return
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      name,
      batteryConfig: { ...batteryConfig },
      scalingFactor,
      summary: results,
      createdAt: Date.now(),
    }
    set(s => ({ scenarios: [...s.scenarios, scenario] }))
  },

  deleteScenario: (id) =>
    set(s => ({ scenarios: s.scenarios.filter(sc => sc.id !== id) })),

  reset: () => set(initialState),
}))
