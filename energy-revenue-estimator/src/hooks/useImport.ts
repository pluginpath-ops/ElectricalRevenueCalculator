import { useState, useCallback } from 'react'
import { normalizeCSV } from '../ingestion/normalize'
import { useProjectStore } from '../stores/projectStore'
import type { HourlyMatrix } from '../types'

export type ImportTarget = 'generation' | 'price'
export type ImportStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ImportState {
  status: ImportStatus
  matrix: HourlyMatrix | null
  error: string | null
}

export function useImport(target: ImportTarget) {
  const [state, setState] = useState<ImportState>({
    status: 'idle',
    matrix: null,
    error: null,
  })

  const setGeneration = useProjectStore(s => s.setGeneration)
  const setPrice = useProjectStore(s => s.setPrice)

  const importFile = useCallback(async (file: File) => {
    setState({ status: 'loading', matrix: null, error: null })
    try {
      const text = await file.text()
      const unit = target === 'generation' ? 'kWh' : '$/MWh'
      const matrix = await normalizeCSV(text, {
        sourceName: file.name,
        unit,
        seriesType: target,
      })
      setState({ status: 'success', matrix, error: null })
      if (target === 'generation') setGeneration(matrix)
      else setPrice(matrix)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState({ status: 'error', matrix: null, error: msg })
    }
  }, [target, setGeneration, setPrice])

  const importUrl = useCallback(async (url: string, fileName: string) => {
    setState({ status: 'loading', matrix: null, error: null })
    try {
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const text = await resp.text()
      const unit = target === 'generation' ? 'kWh' : '$/MWh'
      const matrix = await normalizeCSV(text, {
        sourceName: fileName,
        unit,
        seriesType: target,
      })
      setState({ status: 'success', matrix, error: null })
      if (target === 'generation') setGeneration(matrix)
      else setPrice(matrix)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setState({ status: 'error', matrix: null, error: msg })
    }
  }, [target, setGeneration, setPrice])

  const reset = useCallback(() => {
    setState({ status: 'idle', matrix: null, error: null })
    if (target === 'generation') setGeneration(null)
    else setPrice(null)
  }, [target, setGeneration, setPrice])

  return { ...state, importFile, importUrl, reset }
}
