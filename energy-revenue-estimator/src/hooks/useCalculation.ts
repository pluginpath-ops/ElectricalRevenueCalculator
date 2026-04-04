import { useEffect, useRef } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { calculateRevenue } from '../engine/revenue'
import { shiftMatrix } from '../utils/shiftMatrix'

const DEBOUNCE_MS = 300

export function useCalculation() {
  const generation = useProjectStore(s => s.generation)
  const price = useProjectStore(s => s.price)
  const generationUtcOffset = useProjectStore(s => s.generationUtcOffset)
  const priceUtcOffset = useProjectStore(s => s.priceUtcOffset)
  const batteryConfig = useProjectStore(s => s.batteryConfig)
  const scalingFactor = useProjectStore(s => s.scalingFactor)
  const setResults = useProjectStore(s => s.setResults)
  const setIsCalculating = useProjectStore(s => s.setIsCalculating)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!generation || !price) {
      setResults(null)
      return
    }

    setIsCalculating(true)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      try {
        // Shift generation to align with price timezone.
        // If generation is in ET (-5) and price is in CT (-6), gen is 1hr ahead:
        // shift gen back 1 hour so hour 0 of gen lines up with hour 0 of price.
        const tzShift = generationUtcOffset - priceUtcOffset
        const alignedGeneration = tzShift !== 0
          ? shiftMatrix(generation, -tzShift)
          : generation

        const results = calculateRevenue(alignedGeneration, price, batteryConfig, scalingFactor)
        setResults(results)
      } catch (err) {
        console.error('Calculation error:', err)
        setResults(null)
      } finally {
        setIsCalculating(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [generation, price, generationUtcOffset, priceUtcOffset, batteryConfig, scalingFactor, setResults, setIsCalculating])
}
