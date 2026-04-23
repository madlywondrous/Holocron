'use client'

import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessage } from '@/lib/chat'
import { getMessageText } from '@/lib/chat'
import { getModelInfo } from '@/lib/models'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MarkdownRenderer } from './MarkdownRenderer'
import { useAppToast } from './MainLayout'

// useLayoutEffect fires before paint (ideal for scroll pinning) but
// doesn't exist on the server. Fall back to useEffect during SSR.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

interface MessageListProps {
  messages: ChatMessage[]
  modelId: string
  isLoading: boolean
  onDeleteTurn?: (messageIds: string[]) => void
  onRegenerateResponse?: (messageId?: string) => void
  onEditMessage?: (messageId: string, newContent: string) => void
}

interface ConversationPair {
  userMessage?: ChatMessage
  assistantMessage?: ChatMessage
}

/**
 * Production-level scroll behavior (matches Claude/ChatGPT):
 *
 * 1. "Stick to bottom" model — not scroll-into-view animations.
 *    We track whether the user is at the bottom. If yes, every time
 *    content height changes we silently set scrollTop = max. Because
 *    content grows by small token increments, this looks perfectly smooth.
 *
 * 2. User scrolls up → we detach, show a "↓ Scroll to bottom" pill.
 *    Auto-scroll stops completely until they click it or manually scroll
 *    back to the bottom region.
 *
 * 3. When a NEW message is sent (messages.length increases) we force
 *    re-attach + smooth scroll to bottom regardless.
 */
export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(function MessageList(
  { messages, modelId, isLoading, onDeleteTurn, onRegenerateResponse, onEditMessage },
  ref,
) {
  const { addToast } = useAppToast()

  // Scroll state ─────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const stickToBottomRef = useRef(true) // are we "pinned"?
  const prevMessageCountRef = useRef(messages.length)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Pair messages into conversation turns
  const pairs = useMemo<ConversationPair[]>(() => {
    return messages.reduce<ConversationPair[]>((collection, message) => {
      if (message.role === 'user') {
        collection.push({ userMessage: message })
        return collection
      }

      const currentPair = collection[collection.length - 1]
      if (currentPair && !currentPair.assistantMessage) {
        currentPair.assistantMessage = message
      } else {
        collection.push({ assistantMessage: message })
      }

      return collection
    }, [])
  }, [messages])

  // ── Ref callback: forward ref + capture locally ──────────────
  const setScrollRef = useCallback(
    (el: HTMLDivElement | null) => {
      scrollRef.current = el
      if (!ref) return
      if (typeof ref === 'function') ref(el)
      else ref.current = el
    },
    [ref],
  )

  // ── Scroll handler: detect whether user is near the bottom ───
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const isAtBottom = distanceFromBottom < 60

    stickToBottomRef.current = isAtBottom
    setShowScrollButton(!isAtBottom)
  }, [])

  // ── When user sends a new message → force re-attach + smooth ─
  useEffect(() => {
    const added = messages.length > prevMessageCountRef.current
    prevMessageCountRef.current = messages.length

    if (added) {
      stickToBottomRef.current = true
      setShowScrollButton(false)

      // Small delay so the DOM has painted the new message card
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      })
    }
  }, [messages.length])

  // ── Sticky bottom: keep pinned as content grows (streaming) ──
  // useLayoutEffect fires BEFORE the browser paints, so the user
  // never sees the frame where content grew but scroll didn't move.
  useIsomorphicLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !stickToBottomRef.current) return

    el.scrollTop = el.scrollHeight
  })

  // ── Manual scroll-to-bottom button action ────────────────────
  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    stickToBottomRef.current = true
    setShowScrollButton(false)
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  return (
    <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Scrollable content area */}
      <div
        ref={setScrollRef}
        onScroll={handleScroll}
        className="scrollbar-thin flex-1 overflow-y-auto min-h-0"
      >
        <div className="mx-auto max-w-4xl px-4 pb-48 pt-4 sm:px-6">
          <div className="flex flex-col gap-6">
            {pairs.map((pair, pairIndex) => {
              const pairKey = pair.userMessage?.id ?? pair.assistantMessage?.id ?? `pair-${pairIndex}`
              const pairMessageIds = [pair.userMessage?.id, pair.assistantMessage?.id].filter(
                (value): value is string => Boolean(value),
              )
              const pairModelId = pair.assistantMessage?.metadata?.model ?? modelId

              return (
                <ConversationPairCard
                  key={pairKey}
                  userMessage={pair.userMessage}
                  assistantMessage={pair.assistantMessage}
                  modelId={pairModelId}
                  isLoading={isLoading && pairIndex === pairs.length - 1}
                  onDeleteTurn={onDeleteTurn}
                  onRegenerateResponse={onRegenerateResponse}
                  onEditMessage={onEditMessage}
                  onToast={addToast}
                  messageIds={pairMessageIds}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Scroll-to-bottom pill */}
      {showScrollButton && (
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-2 rounded-full border border-border/40 bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-muted/80 hover:shadow-xl active:scale-95"
            title="Scroll to bottom"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Scroll to bottom
          </button>
        </div>
      )}
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// Sub-components (unchanged logic, kept below for co-location)
// ═══════════════════════════════════════════════════════════════════

interface ConversationPairCardProps {
  userMessage?: ChatMessage
  assistantMessage?: ChatMessage
  modelId: string
  isLoading: boolean
  messageIds: string[]
  onDeleteTurn?: (messageIds: string[]) => void
  onRegenerateResponse?: (messageId?: string) => void
  onEditMessage?: (messageId: string, newContent: string) => void
  onToast?: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void
}

const ConversationPairCard = React.memo(function ConversationPairCard({
  userMessage,
  assistantMessage,
  modelId,
  isLoading,
  messageIds,
  onDeleteTurn,
  onRegenerateResponse,
  onEditMessage,
  onToast,
}: ConversationPairCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const conversationId = userMessage?.id ?? assistantMessage?.id
  const assistantText = assistantMessage ? getMessageText(assistantMessage) : ''
  const userText = userMessage ? getMessageText(userMessage) : ''
  const [editValue, setEditValue] = useState(userText)
  const modelLabel = getModelInfo(modelId).label

  return (
    <div id={conversationId ? `message-${conversationId}` : undefined} className="animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
        {userMessage && (
          <div className="mb-3 group relative">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full resize-none rounded-md bg-muted/30 p-3 text-lg font-semibold leading-relaxed text-foreground sm:text-xl outline-none focus:ring-1 focus:ring-primary/50"
                  rows={Math.min(5, editValue.split('\n').length || 1)}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditValue(userText)
                    }}
                    className="rounded bg-muted px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editValue.trim() !== userText) {
                        onEditMessage?.(userMessage.id, editValue.trim())
                      }
                      setIsEditing(false)
                    }}
                    disabled={!editValue.trim() || isLoading}
                    className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="break-words text-lg font-semibold leading-relaxed text-foreground sm:text-xl">{userText}</p>
              </>
            )}
          </div>
        )}

        {userMessage && <div className="my-4 border-b border-border/60" />}

        <div className="transition-all duration-300 ease-out">
          {assistantMessage ? (
            assistantText ? (
              <MarkdownRenderer content={assistantText} />
            ) : isLoading ? (
              <LoadingState />
            ) : null
          ) : isLoading ? (
            <LoadingState />
          ) : null}
        </div>
      </div>

      {assistantMessage && (
        <div className="mt-3 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-foreground">{modelLabel}</span>
            <div className="flex items-center gap-1 ml-2">
              {!isLoading && userMessage && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex h-8 w-8 items-center justify-center rounded border border-border/50 bg-card text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-muted/30 hover:text-foreground active:scale-95"
                  title="Edit prompt"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => {
                  onRegenerateResponse?.(assistantMessage.id)
                  onToast?.('Regenerating response...', 'info')
                }}
                disabled={isLoading}
                className="flex h-8 w-8 items-center justify-center rounded border border-border/50 bg-card text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-muted/30 hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                title="Regenerate response"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <CopyButton message={assistantMessage} />
            <DeleteTurnButton messageIds={messageIds} onDeleteTurn={onDeleteTurn} />
          </div>
        </div>
      )}
    </div>
  )
})

function LoadingState() {
  return (
    <div className="mb-4 flex items-center gap-2 text-muted-foreground">
      <div className="flex gap-1">
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: '0.1s' }} />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: '0.2s' }} />
      </div>
      <span className="text-base">Generating response...</span>
    </div>
  )
}

const CopyButton = React.memo(function CopyButton({ message }: { message: ChatMessage }) {
  const { addToast } = useAppToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getMessageText(message))
      addToast('Message copied to clipboard', 'success')
    } catch (error) {
      console.error('Failed to copy text:', error)
      addToast('Failed to copy message', 'error')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex h-8 w-8 items-center justify-center rounded border border-border/50 bg-card text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-muted/30 hover:text-foreground active:scale-95"
      title="Copy message"
    >
      <svg className="h-4 w-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  )
})

function DeleteTurnButton({
  messageIds,
  onDeleteTurn,
}: {
  messageIds: string[]
  onDeleteTurn?: (messageIds: string[]) => void
}) {
  const { addToast } = useAppToast()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleConfirm = () => {
    onDeleteTurn?.(messageIds)
    addToast('Conversation turn deleted', 'success')
    setShowConfirm(false)
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex h-8 w-8 items-center justify-center rounded border border-border/50 bg-card text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-destructive/10 hover:text-destructive active:scale-95"
        title="Delete turn"
      >
        <svg className="h-4 w-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {showConfirm && (
        <ConfirmDialog
          title="Delete Turn"
          message="Delete this prompt and response from the current tab?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
