import { useCallback, useState, type DragEvent } from 'react'
import { Upload } from 'lucide-react'

interface Props {
  label: string
  onFile: (f: File) => void
  status: 'idle' | 'loading' | 'success' | 'error'
}

export function FileUploader({ label, onFile, status }: Props) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  const borderColor = status === 'success' ? 'border-[#16A34A]' :
    status === 'error' ? 'border-[#DC2626]' :
    dragging ? 'border-[#2563EB]' : 'border-[#D1D5DB]'

  const textColor = status === 'success' ? 'text-[#16A34A]' :
    status === 'error' ? 'text-[#DC2626]' :
    dragging ? 'text-[#2563EB]' : 'text-[#4B5563]'

  const statusIcon = status === 'success' ? '✓' : status === 'error' ? '✕' : null

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onClick={() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv'
        input.onchange = () => {
          const f = input.files?.[0]
          if (f) onFile(f)
        }
        input.click()
      }}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors select-none ${borderColor} ${textColor}
        hover:border-[#2563EB] hover:text-[#2563EB]`}
    >
      <div className="flex flex-col items-center gap-2">
        {status === 'loading' ? (
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload size={24} className="opacity-60" />
        )}
        <div className="text-sm font-medium">
          {statusIcon && <span className="mr-1">{statusIcon}</span>}
          {label}
        </div>
        <div className="text-xs opacity-70">
          {status === 'idle' ? 'Drop a CSV file here or click to browse' :
           status === 'loading' ? 'Parsing…' :
           status === 'success' ? 'Loaded successfully' :
           'Upload failed — try again'}
        </div>
      </div>
    </div>
  )
}
