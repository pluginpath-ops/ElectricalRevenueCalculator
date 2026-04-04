import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const pad = { sm: 'p-3', md: 'p-4', lg: 'p-6' }[padding]
  return (
    <div className={`bg-white border border-[#D1D5DB] rounded-lg ${pad} ${className}`}>
      {children}
    </div>
  )
}
