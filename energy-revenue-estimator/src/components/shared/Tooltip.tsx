import { useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'

interface Props {
  content: string
  children?: ReactNode
}

export function Tooltip({ content, children }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children ?? <Info size={13} className="text-[#9CA3AF] cursor-help" />}
      {visible && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50
            bg-[#1F2937] text-white text-xs rounded px-2 py-1 whitespace-nowrap max-w-[280px]"
        >
          {content}
        </span>
      )}
    </span>
  )
}
