import { create } from 'zustand'

interface ChartInteractionState {
  selectedDay: number | null
  brushRange: [number, number] | null
  selectedVariable: 'generation' | 'price' | 'revenue'
  setSelectedDay: (d: number | null) => void
  setBrushRange: (r: [number, number] | null) => void
  setSelectedVariable: (v: 'generation' | 'price' | 'revenue') => void
}

export const useChartInteraction = create<ChartInteractionState>(set => ({
  selectedDay: null,
  brushRange: null,
  selectedVariable: 'generation',
  setSelectedDay: (d) => set({ selectedDay: d }),
  setBrushRange: (r) => set({ brushRange: r }),
  setSelectedVariable: (v) => set({ selectedVariable: v }),
}))
