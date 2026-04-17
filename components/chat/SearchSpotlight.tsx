'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getMessageText } from '@/lib/chat'
import { Input } from '@/components/ui/input'
import { useChatStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'session' | 'tab' | 'message'
  sessionId: string
  tabId?: string
  headline: string
  metadata?: string
  preview?: string
}

export function SearchSpotlight() {
  const { sessions, showSearchPalette, setShowSearchPalette, setActiveSession, setActiveTab } = useChatStore()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!showSearchPalette) {
      return
    }

    setQuery('')
    setDebouncedQuery('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [showSearchPalette])

  useEffect(() => {
    if (!showSearchPalette) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearchPalette(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setShowSearchPalette, showSearchPalette])

  // Debounce the query by 200ms to avoid searching on every keystroke
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, 200)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query])

  const results = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase()
    if (!normalized) {
      return [] as SearchResult[]
    }

    const collected: SearchResult[] = []

    sessions.forEach((session) => {
      if (session.name.toLowerCase().includes(normalized)) {
        collected.push({
          id: `session-${session.id}`,
          type: 'session',
          sessionId: session.id,
          headline: session.name,
          metadata: `${session.tabs.length} tab${session.tabs.length === 1 ? '' : 's'}`,
        })
      }

      session.tabs.forEach((tab) => {
        if (tab.name.toLowerCase().includes(normalized)) {
          collected.push({
            id: `tab-${tab.id}`,
            type: 'tab',
            sessionId: session.id,
            tabId: tab.id,
            headline: tab.name,
            metadata: session.name,
          })
        }

        tab.messages.forEach((message) => {
          const text = getMessageText(message)
          const lowerText = text.toLowerCase()
          if (!lowerText.includes(normalized)) {
            return
          }

          const startIndex = Math.max(0, lowerText.indexOf(normalized) - 30)
          const snippet = text.slice(startIndex, startIndex + 120)

          collected.push({
            id: `message-${message.id}`,
            type: 'message',
            sessionId: session.id,
            tabId: tab.id,
            headline: tab.name,
            metadata: `${session.name} • ${message.role}`,
            preview: `${startIndex > 0 ? '...' : ''}${snippet}${snippet.length === 120 ? '...' : ''}`,
          })
        })
      })
    })

    return collected.slice(0, 20)
  }, [debouncedQuery, sessions])

  const handleResultClick = (result: SearchResult) => {
    setActiveSession(result.sessionId)
    if (result.tabId) {
      setActiveTab(result.sessionId, result.tabId)
    }
    setShowSearchPalette(false)
  }

  if (!showSearchPalette) {
    return null
  }

  return (
    <div className="spotlight-overlay">
      <div className="spotlight-backdrop" onClick={() => setShowSearchPalette(false)} />

      <div className="spotlight-panel overflow-hidden">
        <div className="border-b border-border/60 bg-background px-6 py-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">search</span>
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sessions, tabs, or messages"
              className="h-11 border-border/60 bg-background/85 pl-9 pr-3 text-base focus-visible:ring-primary/40"
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground/80">Tip: <kbd className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-xs font-mono">⌘K</kbd> to toggle search from anywhere.</p>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.trim().length === 0 ? (
            <div className="px-6 py-12 text-center text-base text-muted-foreground/80">Start typing to search across conversations.</div>
          ) : results.length === 0 && debouncedQuery === query ? (
            <div className="px-6 py-12 text-center text-base text-muted-foreground/80">No matches yet. Try another keyword.</div>
          ) : results.length === 0 ? (
            <div className="px-6 py-12 text-center text-base text-muted-foreground/80">
              <div className="flex items-center justify-center gap-2">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '0.1s' }} />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => handleResultClick(result)}
                    className="flex w-full items-start gap-3 px-6 py-3 text-left transition hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        'material-symbols-outlined mt-0.5 text-lg text-muted-foreground/80',
                        result.type === 'session' && 'text-primary',
                        result.type === 'tab' && 'text-blue-400',
                        result.type === 'message' && 'text-emerald-400',
                      )}
                    >
                      {result.type === 'session' ? 'hub' : result.type === 'tab' ? 'tab' : 'article'}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-base font-semibold text-foreground">{result.headline}</p>
                        {result.metadata && (
                          <span className="text-[11px] uppercase tracking-widest text-muted-foreground/60">{result.metadata}</span>
                        )}
                      </div>
                      {result.preview && <p className="max-h-12 overflow-hidden text-xs leading-relaxed text-muted-foreground/90">{result.preview}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
