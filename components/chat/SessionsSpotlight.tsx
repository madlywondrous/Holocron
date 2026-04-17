'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useChatStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function SessionsSpotlight() {
  const { showSessionPalette, setShowSessionPalette, sessions, activeSessionId, setActiveSession, createSession, deleteSession, renameSession } = useChatStore()
  const [query, setQuery] = useState('')
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!showSessionPalette) {
      return
    }

    setQuery('')
    setRenamingSessionId(null)
    setDeletingSessionId(null)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [showSessionPalette])

  useEffect(() => {
    if (!showSessionPalette) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSessionPalette(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setShowSessionPalette, showSessionPalette])

  useEffect(() => {
    if (renamingSessionId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingSessionId])

  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return sessions
    }

    return sessions.filter((session) => session.name.toLowerCase().includes(normalized))
  }, [query, sessions])

  const nextSessionName = query.trim() || `Session ${sessions.length + 1}`

  const handleFinishRename = () => {
    if (renamingSessionId && renameValue.trim()) {
      renameSession(renamingSessionId, renameValue.trim())
    }
    setRenamingSessionId(null)
    setRenameValue('')
  }

  const handleConfirmDelete = () => {
    if (deletingSessionId) {
      deleteSession(deletingSessionId)
    }
    setDeletingSessionId(null)
  }

  if (!showSessionPalette) {
    return null
  }

  return (
    <div className="spotlight-overlay">
      <div className="spotlight-backdrop" onClick={() => setShowSessionPalette(false)} />

      <div className="spotlight-panel overflow-hidden">
        <div className="border-b border-border/60 bg-background px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold uppercase tracking-wide text-foreground">Sessions</h2>
              <p className="text-sm text-muted-foreground/80">Jump between sessions or create a fresh one.</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSessionPalette(false)}
              className="command-dial h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </Button>
          </div>

          <div className="mt-4 flex gap-3">
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a session or type a new name"
              className="h-11 border-border/60 bg-background/85 text-base focus-visible:ring-primary/40"
            />
            <Button
              onClick={() => {
                const id = createSession(nextSessionName)
                setActiveSession(id)
                setShowSessionPalette(false)
              }}
              className="h-11 px-4"
            >
              New Session
            </Button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="px-6 py-12 text-center text-base text-muted-foreground/80">
              No session matches yet. Create <span className="font-medium text-foreground">{nextSessionName}</span>.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {filteredSessions.map((session) => (
                <li key={session.id}>
                  <div
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition hover:bg-muted/40',
                      session.id === activeSessionId && 'bg-primary/6',
                    )}
                  >
                    {renamingSessionId === session.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleFinishRename()
                          } else if (e.key === 'Escape') {
                            setRenamingSessionId(null)
                            setRenameValue('')
                          }
                          e.stopPropagation()
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-background border border-border rounded px-2 py-1 text-base outline-none focus:ring-1 focus:ring-primary"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSession(session.id)
                          setShowSessionPalette(false)
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-base font-semibold text-foreground">{session.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground/60">
                          {session.tabs.length} tab{session.tabs.length === 1 ? '' : 's'}
                        </p>
                      </button>
                    )}

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {session.id === activeSessionId && renamingSessionId !== session.id && (
                        <span className="material-symbols-outlined text-primary mr-1">check_circle</span>
                      )}

                      {/* Rename button */}
                      {renamingSessionId !== session.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setRenamingSessionId(session.id)
                            setRenameValue(session.name)
                          }}
                          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
                          title="Rename session"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingSessionId(session.id)
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete session"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {deletingSessionId && (
        <ConfirmDialog
          title="Delete Session"
          message="Delete this session and all its tabs? This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingSessionId(null)}
        />
      )}
    </div>
  )
}
