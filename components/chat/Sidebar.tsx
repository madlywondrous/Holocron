'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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

  const handleFinishRename = React.useCallback(() => {
    if (activeSession && renamingTabId && renameValue.trim()) {
      renameTab(activeSession.id, renamingTabId, renameValue.trim())
    }
    setRenamingTabId(null)
    setRenameValue('')
  }, [activeSession, renamingTabId, renameValue, renameTab])

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

  // Focus input when renaming starts
  React.useEffect(() => {
    if (renamingTabId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renamingTabId])

  if (sidebarCollapsed) {
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border/60 bg-card/35 backdrop-blur">
      <div className="px-3 py-3 border-b border-border/50">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCreateTab}
          disabled={!activeSession}
          className="h-9 w-full justify-center gap-2 text-base font-semibold"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Tab
        </Button>
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
              {renamingTabId === tab.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleFinishRename()
                    } else if (e.key === 'Escape') {
                      handleCancelRename()
                    }
                    e.stopPropagation()
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-background border border-border rounded px-2 py-0.5 text-base outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <>
                  <span
                    onClick={() => setActiveTab(activeSession.id, tab.id)}
                    className="flex-1 truncate text-left cursor-pointer"
                  >
                    {tab.name}
                  </span>

                  {/* Action Buttons - Reveal on Hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Rename Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartRename(tab.id, tab.name)
                      }}
                      className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground bg-background border border-border hover:bg-muted rounded transition-colors flex-shrink-0"
                      title="Rename"
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
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

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