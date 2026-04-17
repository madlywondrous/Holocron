'use client'

import { useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/lib/store'
import { cn } from '@/lib/utils'

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
  const setShowSessionPalette = useChatStore((s) => s.setShowSessionPalette)
  const setShowSearchPalette = useChatStore((s) => s.setShowSearchPalette)

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

  const handleOpenSessions = useCallback(() => {
    setShowSearchPalette(false)
    setShowSettings(false)
    setShowSessionPalette(true)
  }, [setShowSearchPalette, setShowSettings, setShowSessionPalette])

  const handleOpenSearch = useCallback(() => {
    setShowSessionPalette(false)
    setShowSettings(false)
    setShowSearchPalette(true)
  }, [setShowSessionPalette, setShowSettings, setShowSearchPalette])

  const handleOpenSettings = useCallback(() => {
    setShowSessionPalette(false)
    setShowSearchPalette(false)
    setShowSettings(true)
  }, [setShowSessionPalette, setShowSearchPalette, setShowSettings])

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex h-12 items-center justify-between px-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8 flex-shrink-0 text-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-2xl">{sidebarCollapsed ? 'dock_to_right' : 'dock_to_left'}</span>
          </Button>

          <div className="flex min-w-0 items-center text-base font-semibold uppercase text-foreground">
            <span className="tracking-[0.18em]">HOLOCRON</span>
            <span className="mx-2 text-border">/</span>
            <span className="truncate tracking-[0.08em] text-foreground/80">{tabName.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenSessions}
            className="h-8 w-8 rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
            aria-label="Open sessions (⌘/)"
          >
            <span className="material-symbols-outlined text-2xl">workspaces</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenSearch}
            className="h-8 w-8 rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
            aria-label="Search (⌘K)"
          >
            <span className="material-symbols-outlined text-2xl">search</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenSettings}
            className="h-8 w-8 rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
            aria-label="Open settings"
          >
            <span className="material-symbols-outlined text-2xl">vpn_key</span>
          </Button>

          {onToggleTimeline && activeSession && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTimeline}
              className={cn(
                'h-8 w-8 rounded-md transition-all duration-200',
                showTimeline ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )}
              aria-label="Toggle chat navigation"
            >
              <span className="material-symbols-outlined text-2xl">timeline</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
