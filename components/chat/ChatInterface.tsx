'use client'

import { useEffect, useMemo } from 'react'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { useChatStore } from '@/lib/store'

export function ChatInterface() {
  const sessions = useChatStore((s) => s.sessions)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const hydrated = useChatStore((s) => s.hydrated)
  const initializeApp = useChatStore((s) => s.initializeApp)

  useEffect(() => {
    if (hydrated) {
      initializeApp()
    }
  }, [hydrated, initializeApp])

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId),
    [sessions, activeSessionId],
  )

  const activeTab = useMemo(
    () => activeSession?.tabs.find((tab) => tab.id === activeSession.activeTabId),
    [activeSession],
  )

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading Holocron...</p>
      </div>
    )
  }

  if (!activeSession || !activeTab) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">Holocron is ready</p>
          <p className="text-sm text-muted-foreground/70">Open settings, add your Gemini key, and start chatting.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <ChatContainer sessionId={activeSession.id} tabId={activeTab.id} />
    </div>
  )
}
