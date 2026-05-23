import React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  content: string
  position?: 'bottom' | 'top' | 'left' | 'right'
  className?: string
}

export function Tooltip({ children, content, position = 'bottom', className }: TooltipProps) {
  return (
    <div className={cn("group relative flex items-center justify-center", className)}>
      {children}
      <div className={cn(
        "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100",
        position === 'bottom' && "top-full mt-2",
        position === 'top' && "bottom-full mb-2",
        position === 'left' && "right-full mr-2",
        position === 'right' && "left-full ml-2"
      )}>
        {content}
      </div>
    </div>
  )
}
