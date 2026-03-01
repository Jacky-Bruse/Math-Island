import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function PageContainer({ children, className = '' }: Props) {
  return (
    <div className={`min-h-dvh flex flex-col items-center px-4 py-6 ${className}`}>
      {children}
    </div>
  )
}
