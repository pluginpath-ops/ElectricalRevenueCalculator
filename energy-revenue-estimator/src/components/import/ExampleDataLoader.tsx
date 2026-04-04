import { useEffect, useState } from 'react'

interface ManifestEntry {
  id: string
  label: string
  file: string
  type: 'generation' | 'price'
  format: string
  unit: string
  description: string
}

interface Props {
  target: 'generation' | 'price'
  onLoad: (url: string, fileName: string) => void
  disabled?: boolean
}

export function ExampleDataLoader({ target, onLoad, disabled }: Props) {
  const [manifest, setManifest] = useState<ManifestEntry[]>([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    fetch('/examples/manifest.json')
      .then(r => r.json())
      .then((data: ManifestEntry[]) => {
        setManifest(data)
        const first = data.find((e: ManifestEntry) => e.type === target)
        if (first) {
          setSelected(first.id)
          onLoad(`/examples/${first.file}`, first.file)
        }
      })
      .catch(console.error)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const options = manifest.filter(e => e.type === target)

  const handleLoad = () => {
    const entry = options.find(e => e.id === selected)
    if (!entry) return
    onLoad(`/examples/${entry.file}`, entry.file)
  }

  return (
    <div className="flex gap-2">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        disabled={disabled}
        className="flex-1 border border-[#D1D5DB] rounded-md px-3 py-2 text-sm
          bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]
          disabled:opacity-50"
      >
        <option value="">— Select an example —</option>
        {options.map(e => (
          <option key={e.id} value={e.id}>{e.label}</option>
        ))}
      </select>
      <button
        onClick={handleLoad}
        disabled={!selected || disabled}
        className="px-3 py-2 text-sm bg-[#2563EB] text-white rounded-md
          hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Load
      </button>
    </div>
  )
}
