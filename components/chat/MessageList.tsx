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
  { messages, modelId, isLoading, onDeleteTurn, onRegenerateResponse },
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
  onToast,
}: ConversationPairCardProps) {
  const conversationId = userMessage?.id ?? assistantMessage?.id
  const assistantText = assistantMessage ? getMessageText(assistantMessage) : ''
  const userText = userMessage ? getMessageText(userMessage) : ''
  const modelLabel = getModelInfo(modelId).label

  return (
    <div id={conversationId ? `message-${conversationId}` : undefined} className="animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
        {userMessage && (
          <div className="mb-3">
            <p className="break-words text-lg font-semibold leading-relaxed text-foreground sm:text-xl">{userText}</p>
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
            <button
              onClick={() => {
                onRegenerateResponse?.(assistantMessage.id)
                onToast?.('Regenerating response...', 'info')
              }}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded border border-border/50 bg-card px-2 py-1 text-sm text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-muted/30 hover:text-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              title="Regenerate response"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rewrite
            </button>
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
