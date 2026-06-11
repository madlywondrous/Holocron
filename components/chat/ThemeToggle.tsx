'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sun, Moon, Monitor, SlidersHorizontal } from 'lucide-react'

export function ThemeToggle() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-8 w-8 text-muted-foreground transition-all duration-200",
          open && "bg-secondary text-foreground"
        )}
        aria-label="Toggle theme"
        title="Theme options"
      >
        <SlidersHorizontal size={18} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-4 w-[240px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-3xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium pl-2 text-foreground/80 tracking-wide">Theme</span>
            
            <div className="flex items-center bg-background/60 rounded-full p-1 border border-border/30">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 active:scale-95 hover:scale-105",
                  mounted && theme === 'light' ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Light mode"
              >
                <Sun size={16} />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 mx-1 active:scale-95 hover:scale-105",
                  mounted && theme === 'system' ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="System theme"
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 active:scale-95 hover:scale-105",
                  mounted && theme === 'dark' ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Dark mode"
              >
                <Moon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
