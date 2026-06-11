'use client'

import { useMemo, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/chat/ThemeToggle'

interface TopBarProps {
  onToggleTimeline?: () => void
  showTimeline?: boolean
}

export function TopBar({ onToggleTimeline, showTimeline }: TopBarProps = {}) {
  // Granular selectors — only re-render when these specific values change
  const sessions = useChatStore((s) => s.sessions)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const sidebarCollapsed = useChatStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useChatStore((s) => s.setSidebarCollapsed)
  const setShowSettings = useChatStore((s) => s.setShowSettings)
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId),
    [activeSessionId, sessions],
  )

  const activeTab = useMemo(() => {
    if (!activeSession?.activeTabId) {
      return undefined
    }

    return activeSession.tabs.find((tab) => tab.id === activeSession.activeTabId)
  }, [activeSession])

  const tabName = activeTab?.name ?? 'New Tab'

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true)
  }, [setShowSettings])

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex h-12 items-center justify-between px-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="group h-8 w-8 flex-shrink-0 text-muted-foreground transition-all duration-200"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Image src="/holocron-icon.png" alt="App Icon" width={22} height={22} className="h-[22px] w-[22px] invert dark:invert-0 opacity-80 group-hover:hidden transition-opacity" />
            <span className="material-symbols-outlined text-2xl hidden group-hover:block">
              {sidebarCollapsed ? 'dock_to_right' : 'dock_to_left'}
            </span>
          </Button>

          <div className="flex min-w-0 items-center text-base font-semibold uppercase text-foreground">
            <span className="tracking-[0.18em]">HOLOCRON</span>
            <span className="mx-2 text-border">/</span>
            <span className="truncate tracking-[0.08em] text-foreground/80">{tabName.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenSettings}
            className="h-8 w-8 text-muted-foreground transition-all duration-200"
            aria-label="Open settings"
            title="Settings"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </Button>

          {onToggleTimeline && activeSession && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTimeline}
              className={cn(
                'h-8 w-8 rounded-md text-muted-foreground transition-all duration-200',
                showTimeline ? 'bg-secondary text-foreground ring-2 ring-primary/50' : '',
              )}
              aria-label="Toggle chat navigation"
              title="Timeline"
            >
              <span className="material-symbols-outlined text-2xl">timeline</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
