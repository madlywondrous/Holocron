import React, { useRef } from 'react'
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
      <div className="relative flex flex-1 items-center justify-center p-8 text-muted-foreground animate-in fade-in duration-700">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-grid-white/[0.02] bg-[size:60px_60px]">
          <div className="absolute inset-0 bg-background/90 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        </div>
        
        <div className="relative max-w-lg text-center space-y-8 z-10">
          <div className="space-y-6">
            <div className="w-full flex justify-center">
              <pre className="text-[0.85rem] sm:text-xl md:text-3xl lg:text-4xl font-mono text-logo-gradient font-bold select-none text-left overflow-visible" style={{ lineHeight: 1.05 }}>
{`█  █ █▀▀█ █    █▀▀█ █▀▀▀ █▀▀█ █▀▀█ █▄ █
█▀▀█ █  █ █    █  █ █    █▀▀▄ █  █ █ ▀█
▀  ▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀  ▀`}
              </pre>
            </div>
            <p className="text-base text-muted-foreground/80 max-w-[80%] mx-auto leading-relaxed mt-4">
              Experience the next generation of AI chat. Add your API key to unlock powerful local models securely stored in your browser.
            </p>
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-full bg-foreground px-8 py-3.5 text-sm font-semibold text-background shadow-lg shadow-foreground/10 transition-all hover:bg-foreground/90 hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
              Configure API Key
            </button>
          </div>
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
          <div className="absolute bottom-0 left-0 right-0 z-30 pt-12 pb-6">
            {/* iOS-style borderless blur fade */}
            <div className="pointer-events-none absolute inset-0 backdrop-blur-xl bg-background/40 [mask-image:linear-gradient(to_top,black_70%,transparent)]" />
            
            <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
              <div className="pointer-events-auto rounded-3xl border border-border/60 bg-background/95 p-2 shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur-md ring-1 ring-foreground/5 transition-all hover:shadow-[0_0_40px_-10px_rgba(0,0,0,0.4)]">
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
        <div className="relative flex flex-1 min-h-0 items-center justify-center p-4 animate-in fade-in duration-700">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-grid-white/[0.02] bg-[size:60px_60px]">
            <div className="absolute inset-0 bg-background/90 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          </div>

          <div className="relative w-full max-w-3xl z-10 flex flex-col items-center">
            <div className="mb-12 text-center space-y-6">
              <div className="w-full flex justify-center">
                <pre className="text-[0.85rem] sm:text-xl md:text-3xl lg:text-4xl font-mono text-logo-gradient font-bold select-none text-left overflow-visible" style={{ lineHeight: 1.05 }}>
{`█  █ █▀▀█ █    █▀▀█ █▀▀▀ █▀▀█ █▀▀█ █▄ █
█▀▀█ █  █ █    █  █ █    █▀▀▄ █  █ █ ▀█
▀  ▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀  ▀ ▀▀▀▀ ▀  ▀`}
                </pre>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-4">What can I help you with?</p>
            </div>
            
            <div className="w-full max-w-2xl mb-8">
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
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mt-4">
              {[
                { icon: 'code', text: 'Write code' },
                { icon: 'edit_document', text: 'Draft an essay' },
                { icon: 'lightbulb', text: 'Brainstorm ideas' },
                { icon: 'analytics', text: 'Analyze data' },
              ].map((suggestion, i) => (
                <button 
                  key={i}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border/40 bg-secondary/20 p-4 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-[20px] opacity-70">{suggestion.icon}</span>
                  <span className="text-xs font-medium">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
