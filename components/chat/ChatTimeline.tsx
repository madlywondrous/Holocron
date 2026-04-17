'use client'

import { useMemo } from 'react'
import { getMessageText, getMessageTimestamp } from '@/lib/chat'
import { getModelInfo } from '@/lib/models'
import { useChatStore } from '@/lib/store'

interface ChatTimelineProps {
  sessionId: string
  tabId: string
}

export function ChatTimeline({ sessionId, tabId }: ChatTimelineProps) {
  const sessions = useChatStore((s) => s.sessions)

  const session = useMemo(
    () => sessions.find((candidateSession) => candidateSession.id === sessionId),
    [sessionId, sessions],
  )

  const tab = useMemo(
    () => session?.tabs.find((candidateTab) => candidateTab.id === tabId),
    [session, tabId],
  )

  const prompts = useMemo(() => {
    if (!tab) {
      return []
    }

    return tab.messages
      .filter((message) => message.role === 'user')
      .map((message, index) => ({
        id: message.id,
        content: getMessageText(message),
        createdAt: getMessageTimestamp(message),
        index: index + 1,
      }))
  }, [tab])

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`)
    if (!element) {
      return
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.classList.add('highlight-message')
    setTimeout(() => element.classList.remove('highlight-message'), 2000)
  }

  return (
    <div className="flex h-full flex-col bg-background/50 backdrop-blur-sm">
      <div className="relative flex h-full flex-col overflow-hidden">
        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 pb-20">
          {prompts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <span className="material-symbols-outlined mb-3 text-4xl text-muted-foreground/40">chat_bubble_outline</span>
              <p className="text-sm text-muted-foreground">No prompts yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Start chatting to build a timeline.</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute bottom-0 left-[9px] top-0 w-[2px] bg-gradient-to-b from-primary via-primary/60 to-primary/20" />
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => scrollToMessage(prompt.id)}
                    className="group relative -ml-2 flex w-full items-start gap-2 rounded-lg p-2 text-left transition-all duration-200 hover:bg-primary/5"
                  >
                    <div className="relative mt-1 flex-shrink-0">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background transition-transform duration-200 group-hover:scale-110">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary group-hover:animate-pulse" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="line-clamp-2 text-sm leading-relaxed text-foreground/90 transition-colors group-hover:text-foreground">
                        {prompt.content || `Prompt ${prompt.index}`}
                      </p>
                      {prompt.createdAt && (
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          {new Date(prompt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="material-symbols-outlined text-sm text-primary">arrow_forward</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {prompts.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>
                    {prompts[0].createdAt ? new Date(prompts[0].createdAt).toLocaleDateString() : 'Current session'}
                  </span>
                </div>
                <div>
                  Model: <span className="font-medium text-foreground">{getModelInfo(tab?.model ?? '').label}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
