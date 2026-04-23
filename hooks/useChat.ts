import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useChat as useVercelChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { ChatMessage } from '@/lib/chat'
import { DEFAULT_MODEL, getModelsForProvider, getProviderForModel } from '@/lib/models'
import { useAPIKeyStore } from '@/lib/api-key-store'
import { useChatStore } from '@/lib/store'

function requireProviderKey(model: string, setShowSettings: (show: boolean) => void): boolean {
  const tabModelProvider = getProviderForModel(model)
  const storeState = useAPIKeyStore.getState()
  
  let key = ''
  switch(tabModelProvider) {
    case 'google': key = storeState.googleKey; break;
    case 'openrouter': key = storeState.openrouterKey; break;
    case 'openai': key = storeState.openaiKey; break;
    case 'anthropic': key = storeState.anthropicKey; break;
    case 'xai': key = storeState.xaiKey; break;
    case 'groq': key = storeState.groqKey; break;
  }

  if (!key) {
    storeState.setProvider(tabModelProvider)
    setShowSettings(true)
    return false
  }
  
  return true
}

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
          
          const currentSession = useChatStore.getState().sessions.find(
            (candidateSession) => candidateSession.id === sessionId,
          )
          const currentTab = currentSession?.tabs.find((candidateTab) => candidateTab.id === tabId)
          const model = currentTab?.model ?? DEFAULT_MODEL
          const modelProvider = getProviderForModel(model)

          // Only send the specific key required for the active model
          switch (modelProvider) {
            case 'google': if (store.googleKey) headers.set('X-Google-API-Key', store.googleKey); break;
            case 'openrouter': if (store.openrouterKey) headers.set('X-OpenRouter-API-Key', store.openrouterKey); break;
            case 'openai': if (store.openaiKey) headers.set('X-OpenAI-API-Key', store.openaiKey); break;
            case 'anthropic': if (store.anthropicKey) headers.set('X-Anthropic-API-Key', store.anthropicKey); break;
            case 'xai': if (store.xaiKey) headers.set('X-xAI-API-Key', store.xaiKey); break;
            case 'groq': if (store.groqKey) headers.set('X-Groq-API-Key', store.groqKey); break;
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

  const hasAnyKey = useAPIKeyStore((state) => 
    state.googleKey.length > 0 || 
    state.openrouterKey.length > 0 || 
    state.openaiKey.length > 0 || 
    state.anthropicKey.length > 0 || 
    state.xaiKey.length > 0 || 
    state.groqKey.length > 0
  )
  
  const hasApiKey = hasAnyKey

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
      if (!tab || !requireProviderKey(tab.model, setShowSettings)) return

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
    [messages.length, renameTab, sendChatMessage, sessionId, setShowSettings, tab, tabId],
  )

  const regenerateResponse = useCallback(
    async (messageId?: string) => {
      if (!requireProviderKey(tab?.model ?? DEFAULT_MODEL, setShowSettings)) return
      await regenerate(messageId ? { messageId } : undefined)
    },
    [regenerate, setShowSettings, tab?.model],
  )

  const deleteTurn = useCallback(
    (messageIds: string[]) => {
      const idsToRemove = new Set(messageIds)
      setMessages((currentMessages) => currentMessages.filter((message) => !idsToRemove.has(message.id)))
    },
    [setMessages],
  )

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!requireProviderKey(tab?.model ?? DEFAULT_MODEL, setShowSettings)) return

      // Find where this message is in the history
      const index = messages.findIndex(m => m.id === messageId)
      if (index === -1) return

      // Truncate history to right before the edited message
      const previousMessages = messages.slice(0, index)
      setMessages(previousMessages)

      // Send the new message, which will append to the newly truncated history
      await sendChatMessage({
        text: newContent,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      })
    },
    [messages, setMessages, sendChatMessage, setShowSettings, tab?.model]
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
    editMessage,
    regenerateResponse,
    deleteTurn,
    changeModel,
    stop,
  }
}
