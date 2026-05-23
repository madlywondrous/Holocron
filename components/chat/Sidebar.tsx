'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RenameDialog } from '@/components/ui/rename-dialog'
import { useChatStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const sessions = useChatStore((s) => s.sessions)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const sidebarCollapsed = useChatStore((s) => s.sidebarCollapsed)
  const createTab = useChatStore((s) => s.createTab)
  const setActiveTab = useChatStore((s) => s.setActiveTab)
  const deleteTab = useChatStore((s) => s.deleteTab)
  const renameTab = useChatStore((s) => s.renameTab)

  const setShowSessionPalette = useChatStore((s) => s.setShowSessionPalette)
  const setShowSearchPalette = useChatStore((s) => s.setShowSearchPalette)

  const handleOpenSessions = React.useCallback(() => {
    setShowSearchPalette(false)
    setShowSessionPalette(true)
  }, [setShowSearchPalette, setShowSessionPalette])

  const handleOpenSearch = React.useCallback(() => {
    setShowSessionPalette(false)
    setShowSearchPalette(true)
  }, [setShowSessionPalette, setShowSearchPalette])
  const [renamingTabId, setRenamingTabId] = React.useState<string | null>(null)
  const [renameValue, setRenameValue] = React.useState('')
  const [deletingTabId, setDeletingTabId] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const activeSession = React.useMemo(
    () => sessions.find((session) => session.id === activeSessionId),
    [sessions, activeSessionId]
  )

  const handleCreateTab = React.useCallback(() => {
    if (!activeSession) {
      return
    }
    // Always use "New Tab" as name, the store will handle checking for existing empty tabs
    createTab(activeSession.id, 'New Tab')
  }, [activeSession, createTab])

  const handleStartRename = React.useCallback((tabId: string, currentName: string) => {
    setRenamingTabId(tabId)
    setRenameValue(currentName)
  }, [])

  const handleFinishRename = React.useCallback((newValue: string) => {
    if (activeSession && renamingTabId && newValue.trim()) {
      renameTab(activeSession.id, renamingTabId, newValue.trim())
    }
    setRenamingTabId(null)
    setRenameValue('')
  }, [activeSession, renamingTabId, renameTab])

  const handleCancelRename = React.useCallback(() => {
    setRenamingTabId(null)
    setRenameValue('')
  }, [])

  const handleConfirmDeleteTab = React.useCallback(() => {
    if (activeSession && deletingTabId) {
      deleteTab(activeSession.id, deletingTabId)
    }
    setDeletingTabId(null)
  }, [activeSession, deletingTabId, deleteTab])

  // Focus input when renaming starts (Removed as we now use RenameDialog modal which handles focus)

  if (sidebarCollapsed) {
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border/60 bg-card/35 backdrop-blur">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/50 shrink-0 gap-2">
        <button
          onClick={handleOpenSearch}
          className="flex-1 flex items-center gap-2 h-8 px-2.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors text-sm"
          title="Search (⌘K)"
          aria-label="Search"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span className="font-medium">Search...</span>
        </button>
        
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleCreateTab}
            disabled={!activeSession}
            className="h-8 w-8 shrink-0 transition-colors"
            title="New Chat"
            aria-label="New Chat"
          >
            <span className="material-symbols-outlined text-[20px]">edit_square</span>
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={handleOpenSessions}
            className="h-8 w-8 shrink-0 transition-all duration-200"
            title="Open sessions (⌘/)"
            aria-label="Open sessions"
          >
            <span className="material-symbols-outlined text-[20px]">workspaces</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
        {!activeSession || activeSession.tabs.length === 0 ? (
          <div className="mt-6 text-center text-base text-muted-foreground/80 px-3">
            <p>{activeSession ? 'Create a tab to begin chatting.' : 'Pick or create a session first.'}</p>
          </div>
        ) : (
          activeSession.tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'group flex h-9 w-full items-center gap-2 rounded-md border pl-3 pr-1 text-base font-medium transition-all backdrop-blur-sm',
                activeSession.activeTabId === tab.id
                  ? 'border-primary/60 bg-primary/15 text-foreground shadow-sm'
                  : 'border-transparent bg-background/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              <>
                <span
                  onClick={() => setActiveTab(activeSession.id, tab.id)}
                  className="flex-1 truncate text-left cursor-pointer"
                >
                  {tab.name}
                </span>

                {/* Action Buttons - Reveal on Hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 transition-opacity duration-200">
                  {/* Rename Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartRename(tab.id, tab.name)
                    }}
                    className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground bg-background border border-border hover:bg-muted rounded transition-colors flex-shrink-0"
                    title="Rename"
                    aria-label="Rename tab"
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingTabId(tab.id)
                    }}
                    className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-destructive bg-background border border-border hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                    title="Close tab"
                    aria-label="Close tab"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
              </>
            </div>
          ))
        )}
      </div>

      {renamingTabId && (
        <RenameDialog
          title="Rename Tab"
          initialValue={renameValue}
          onConfirm={handleFinishRename}
          onCancel={handleCancelRename}
        />
      )}

      {deletingTabId && (
        <ConfirmDialog
          title="Close Tab"
          message="Close this tab and delete its conversation history?"
          confirmLabel="Close"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirmDeleteTab}
          onCancel={() => setDeletingTabId(null)}
        />
      )}
    </div>
  )
}