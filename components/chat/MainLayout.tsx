'use client'

import { Sidebar } from '@/components/chat/Sidebar'
import { SettingsPopup } from '@/components/chat/SettingsPopup'
import { SessionsSpotlight } from '@/components/chat/SessionsSpotlight'
import { SearchSpotlight } from '@/components/chat/SearchSpotlight'
import { TopBar } from '@/components/chat/TopBar'
import { ChatTimeline } from '@/components/chat/ChatTimeline'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { useChatStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'

const ToastContext = createContext<ReturnType<typeof useToast> | null>(null)

export function useAppToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useAppToast must be used within MainLayout')
  }
  return context
}

// Timeline context to share state between MainLayout and ChatContainer
const TimelineContext = createContext<{ showTimeline: boolean } | null>(null)

export function useTimeline() {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error('useTimeline must be used within MainLayout')
  }
  return context
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, setSidebarCollapsed, showSettings, setShowSettings, setShowSearchPalette, setShowSessionPalette, showSearchPalette, showSessionPalette, activeSessionId, sessions } = useChatStore()
  const toast = useToast()
  const [isHoveringEdge, setIsHoveringEdge] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [sidebarOpenedByHover, setSidebarOpenedByHover] = useState(false)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastMoveTime = useRef(0)

  const activeSession = sessions.find(s => s.id === activeSessionId)
  const activeTabId = activeSession?.activeTabId

  // Reset hover state when sidebar is manually toggled
  useEffect(() => {
    setSidebarOpenedByHover(false)
  }, [sidebarCollapsed])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      // ⌘K — toggle search
      if (isMod && e.key === 'k') {
        e.preventDefault()
        setShowSessionPalette(false)
        setShowSettings(false)
        setShowSearchPalette(!showSearchPalette)
        return
      }

      // ⌘/ — toggle session palette
      if (isMod && e.key === '/') {
        e.preventDefault()
        setShowSearchPalette(false)
        setShowSettings(false)
        setShowSessionPalette(!showSessionPalette)
        return
      }

      // Escape — close any open overlay
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false)
          return
        }
        if (showSearchPalette) {
          setShowSearchPalette(false)
          return
        }
        if (showSessionPalette) {
          setShowSessionPalette(false)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSettings, showSearchPalette, showSessionPalette, setShowSettings, setShowSearchPalette, setShowSessionPalette])

  // Hover to open sidebar — throttled mousemove
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now()
    if (now - lastMoveTime.current < 32) {
      return // ~30fps throttle
    }
    lastMoveTime.current = now

    const currentCollapsed = useChatStore.getState().sidebarCollapsed

    if (currentCollapsed) {
      if (e.clientX < 15) {
        setIsHoveringEdge(true)
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = setTimeout(() => {
          setSidebarOpenedByHover(true)
          setSidebarCollapsed(false)
        }, 200)
      } else if (e.clientX > 20) {
        setIsHoveringEdge(false)
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
      }
    } else if (sidebarOpenedByHover && e.clientX > 280) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      closeTimerRef.current = setTimeout(() => {
        setSidebarOpenedByHover(false)
        setSidebarCollapsed(true)
      }, 300)
    } else if (sidebarOpenedByHover && e.clientX < 280) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [sidebarOpenedByHover, setSidebarCollapsed])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [handleMouseMove])

  return (
    <ToastContext.Provider value={toast}>
      <TimelineContext.Provider value={{ showTimeline }}>
        <div className="flex h-screen flex-col bg-background overflow-hidden">
          {/* Hover indicator for collapsed sidebar */}
          {sidebarCollapsed && isHoveringEdge && (
            <div className="fixed left-0 top-0 bottom-0 w-1 bg-primary/50 z-40 transition-opacity" />
          )}

          <TopBar
            onToggleTimeline={() => setShowTimeline(!showTimeline)}
            showTimeline={showTimeline}
          />
          <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
          <SettingsPopup isOpen={showSettings} onClose={() => setShowSettings(false)} />
          <SessionsSpotlight />
          <SearchSpotlight />

          <div className="flex flex-1 overflow-hidden min-h-0">
            <aside
              className={cn(
                'transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 min-h-0',
                sidebarCollapsed ? 'w-0' : 'w-64'
              )}
              onMouseEnter={() => {
                // Cancel any pending close timer when entering sidebar
                if (closeTimerRef.current) {
                  clearTimeout(closeTimerRef.current)
                  closeTimerRef.current = null
                }
              }}
              onMouseLeave={() => {
                // Start close timer when leaving sidebar (only if opened by hover)
                if (sidebarOpenedByHover) {
                  if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
                  closeTimerRef.current = setTimeout(() => {
                    setSidebarOpenedByHover(false)
                    setSidebarCollapsed(true)
                  }, 300)
                }
              }}
            >
              <Sidebar />
            </aside>

            <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background overflow-hidden relative transition-all duration-300">
              {children}
            </main>

            {/* Timeline as a flex column on the right */}
            <aside
              className={cn(
                'transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 min-h-0 border-l border-border/50',
                showTimeline ? 'w-80 opacity-100' : 'w-0 opacity-0'
              )}
            >
              {/* Only render timeline if we have an active session and tab */}
              {activeSessionId && activeTabId && (
                <ChatTimeline
                  sessionId={activeSessionId}
                  tabId={activeTabId}
                />
              )}
            </aside>
          </div>
        </div>
      </TimelineContext.Provider>
    </ToastContext.Provider>
  )
}
