import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useChat as useVercelChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { ChatMessage } from '@/lib/chat'
import { DEFAULT_MODEL, getModelsForProvider, getProviderForModel } from '@/lib/models'
import { useAPIKeyStore } from '@/lib/api-key-store'
import { useChatStore } from '@/lib/store'

export function useChat(sessionId: string, tabId: string) {
  const { sessions, updateTab, renameTab, setShowSettings } = useChatStore()
  const provider = useAPIKeyStore((state) => state.provider)
  const prevMessagesRef = useRef<string>('')

  const session = useMemo(
    () => sessions.find((currentSession) => currentSession.id === sessionId),
    [sessions, sessionId],
  )

  const tab = useMemo(
    () => session?.tabs.find((currentTab) => currentTab.id === tabId),
    [session, tabId],
  )

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatMessage>({
        api: '/api/chat',
        headers: () => {
          const store = useAPIKeyStore.getState()
          const headers = new Headers()

          // Send both keys — the server will pick the right one based on model
          if (store.googleKey) {
            headers.set('X-Google-API-Key', store.googleKey)
          }
          if (store.openrouterKey) {
            headers.set('X-OpenRouter-API-Key', store.openrouterKey)
          }

          return headers
        },
        body: () => {
          const currentSession = useChatStore.getState().sessions.find(
            (candidateSession) => candidateSession.id === sessionId,
          )
          const currentTab = currentSession?.tabs.find((candidateTab) => candidateTab.id === tabId)

          return {
            model: currentTab?.model ?? DEFAULT_MODEL,
          }
        },
      }),
    [sessionId, tabId],
  )

  const {
    messages,
    sendMessage: sendChatMessage,
    regenerate,
    setMessages,
    status,
    stop,
    error,
  } = useVercelChat<ChatMessage>({
    id: tabId,
    messages: tab?.messages ?? [],
    transport,
  })

  // Has at least one key for the current provider
  const hasApiKey = (() => {
    const store = useAPIKeyStore.getState()
    return store.googleKey.length > 0 || store.openrouterKey.length > 0
  })()

  const isLoading = status === 'submitted' || status === 'streaming'

  // Sync messages back to store only when they actually change
  useEffect(() => {
    if (!tab) {
      return
    }

    const fingerprint = JSON.stringify(messages.map((m) => m.id))
    if (fingerprint === prevMessagesRef.current) {
      return
    }

    prevMessagesRef.current = fingerprint
    updateTab(sessionId, tabId, { messages })
  }, [messages, sessionId, tab, tabId, updateTab])

  // Models available for the current provider
  const models = useMemo(() => getModelsForProvider(provider), [provider])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!tab) {
        return
      }

      if (!hasApiKey) {
        setShowSettings(true)
        return
      }

      if (tab.name === 'New Tab' && messages.length === 0) {
        const preview = content.trim().slice(0, 30)
        renameTab(sessionId, tabId, preview + (content.trim().length > 30 ? '...' : ''))
      }

      await sendChatMessage({
        text: content,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      })
    },
    [hasApiKey, messages.length, renameTab, sendChatMessage, sessionId, setShowSettings, tab, tabId],
  )

  const regenerateResponse = useCallback(
    async (messageId?: string) => {
      if (!hasApiKey) {
        setShowSettings(true)
        return
      }

      await regenerate(messageId ? { messageId } : undefined)
    },
    [hasApiKey, regenerate, setShowSettings],
  )

  const deleteTurn = useCallback(
    (messageIds: string[]) => {
      const idsToRemove = new Set(messageIds)
      setMessages((currentMessages) => currentMessages.filter((message) => !idsToRemove.has(message.id)))
    },
    [setMessages],
  )

  const changeModel = useCallback(
    (model: string) => {
      if (!tab) {
        return
      }

      // If the model belongs to a different provider, switch the provider too
      const modelProvider = getProviderForModel(model)
      const currentProvider = useAPIKeyStore.getState().provider
      if (modelProvider !== currentProvider) {
        useAPIKeyStore.getState().setProvider(modelProvider)
      }

      updateTab(sessionId, tabId, { model })
    },
    [sessionId, tab, tabId, updateTab],
  )

  return {
    tab,
    messages,
    models,
    hasApiKey,
    isLoading,
    error: error?.message ?? null,
    sendMessage,
    regenerateResponse,
    deleteTurn,
    changeModel,
    stop,
  }
}
