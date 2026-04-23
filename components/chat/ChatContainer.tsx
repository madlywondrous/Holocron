import React, { useRef } from 'react'
import Image from 'next/image'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { useChat } from '@/hooks/useChat'
import { useChatStore } from '@/lib/store'
import { useAPIKeyStore } from '@/lib/api-key-store'

interface ChatContainerProps {
  sessionId: string
  tabId: string
}

export function ChatContainer({ sessionId, tabId }: ChatContainerProps) {
  const { tab, messages, models, hasApiKey, isLoading, error, sendMessage, editMessage, regenerateResponse, deleteTurn, changeModel, stop } = useChat(
    sessionId,
    tabId,
  )
  const setShowSettings = useChatStore((s) => s.setShowSettings)
  const activeProvider = useAPIKeyStore((s) => s.provider)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  if (!tab) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p className="text-sm">No active tab.</p>
      </div>
    )
  }

  if (!hasApiKey) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        <div className="max-w-md text-center space-y-4">
          <Image src="/holocron-icon.png" alt="Holocron" width={64} height={64} className="mx-auto h-16 w-16" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Add your API key</h3>
            <p className="text-sm text-muted-foreground/80">
              Holocron keeps your keys securely stored locally in the browser.
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open Settings
          </button>
        </div>
      </div>
    )
  }

  const hasMessages = messages.length > 0

  return (
    <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">
      {error && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:px-6">
          {error}
        </div>
      )}

      {hasMessages ? (
        <>
          <MessageList
            ref={scrollContainerRef}
            messages={messages}
            modelId={tab.model}
            isLoading={isLoading}
            onDeleteTurn={deleteTurn}
            onRegenerateResponse={regenerateResponse}
            onEditMessage={editMessage}
          />

          {/* Floating input — sits at the bottom above the message list */}
          <div className="absolute bottom-0 left-0 right-0 z-30">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="relative mx-auto max-w-4xl px-4 pb-6 sm:px-6">
              <div className="pointer-events-auto rounded-3xl border border-border/30 bg-background/20 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <MessageInput
                  onSendMessage={sendMessage}
                  onModelChange={changeModel}
                  placeholder="Ask a follow-up..."
                  modelId={tab.model}
                  availableModels={models}
                  isLoading={isLoading}
                  onStop={isLoading ? stop : undefined}
                  allowCustomModel={activeProvider === 'openrouter'}
                  floating
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 min-h-0 items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-semibold text-foreground">Start a conversation</h2>
              <p className="text-muted-foreground">Ask a question and Holocron will stream the answer back.</p>
            </div>
            <MessageInput
              onSendMessage={sendMessage}
              onModelChange={changeModel}
              placeholder={activeProvider === 'openrouter' ? 'Ask anything...' : 'Ask Gemini anything...'}
              modelId={tab.model}
              availableModels={models}
              isLoading={isLoading}
              allowCustomModel={activeProvider === 'openrouter'}
              centered
            />
          </div>
        </div>
      )}
    </div>
  )
}
