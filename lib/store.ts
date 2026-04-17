import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { normalizeStoredMessage, type ChatMessage } from '@/lib/chat'
import { DEFAULT_MODEL, isSupportedModel } from '@/lib/models'

export interface ChatTab {
  id: string
  name: string
  model: string
  messages: ChatMessage[]
}

export interface Session {
  id: string
  name: string
  tabs: ChatTab[]
  activeTabId: string
  createdAt: string
  updatedAt: string
}

interface ChatStore {
  sessions: Session[]
  activeSessionId?: string
  hydrated: boolean
  initialized: boolean
  sidebarCollapsed: boolean
  showSettings: boolean
  showSessionPalette: boolean
  showSearchPalette: boolean
  initializeApp: () => void
  setHydrated: (hydrated: boolean) => void
  createSession: (name?: string) => string
  deleteSession: (sessionId: string) => void
  setActiveSession: (sessionId: string) => void
  createTab: (sessionId: string, name?: string, model?: string) => void
  deleteTab: (sessionId: string, tabId: string) => void
  setActiveTab: (sessionId: string, tabId: string) => void
  updateTab: (sessionId: string, tabId: string, updates: Partial<ChatTab>) => void
  renameTab: (sessionId: string, tabId: string, newName: string) => void
  renameSession: (sessionId: string, newName: string) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setShowSettings: (show: boolean) => void
  setShowSessionPalette: (show: boolean) => void
  setShowSearchPalette: (show: boolean) => void
}

function now() {
  return new Date().toISOString()
}

function createTabRecord(name = 'New Tab', model = DEFAULT_MODEL): ChatTab {
  return {
    id: crypto.randomUUID(),
    name,
    model,
    messages: [],
  }
}

function createSessionRecord(name = 'New Session'): Session {
  const timestamp = now()
  const tab = createTabRecord()

  return {
    id: crypto.randomUUID(),
    name,
    tabs: [tab],
    activeTabId: tab.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function normalizeTimestamp(value: unknown): string {
  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return now()
}

function normalizeTab(tab: ChatTab): ChatTab {
  return {
    id: typeof tab.id === 'string' && tab.id.length > 0 ? tab.id : crypto.randomUUID(),
    name: typeof tab.name === 'string' && tab.name.trim() ? tab.name : 'New Tab',
    model: isSupportedModel(tab.model) ? tab.model : DEFAULT_MODEL,
    messages: Array.isArray(tab.messages)
      ? tab.messages
          .map((message) => normalizeStoredMessage(message))
          .filter((message): message is ChatMessage => Boolean(message))
      : [],
  }
}

function ensureSessionHasTab(session: Session): Session {
  const normalizedTabs = Array.isArray(session.tabs) ? session.tabs.map(normalizeTab) : []

  if (normalizedTabs.length > 0) {
    const activeTabId = normalizedTabs.some((tab) => tab.id === session.activeTabId)
      ? session.activeTabId
      : normalizedTabs[0].id

    return {
      ...session,
      name: typeof session.name === 'string' && session.name.trim() ? session.name : 'New Session',
      tabs: normalizedTabs,
      activeTabId,
      createdAt: normalizeTimestamp(session.createdAt),
      updatedAt: normalizeTimestamp(session.updatedAt),
    }
  }

  const freshTab = createTabRecord()
  return {
    ...session,
    name: typeof session.name === 'string' && session.name.trim() ? session.name : 'New Session',
    tabs: [freshTab],
    activeTabId: freshTab.id,
    createdAt: normalizeTimestamp(session.createdAt),
    updatedAt: now(),
  }
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: undefined,
      hydrated: false,
      initialized: false,
      sidebarCollapsed: false,
      showSettings: false,
      showSessionPalette: false,
      showSearchPalette: false,

      initializeApp: () => {
        const state = get()

        if (state.initialized) {
          return
        }

        if (state.sessions.length === 0) {
          const initialSession = createSessionRecord()
          set({
            sessions: [initialSession],
            activeSessionId: initialSession.id,
            initialized: true,
          })
          return
        }

        const repairedSessions = state.sessions.map(ensureSessionHasTab)
        const hasActiveSession = repairedSessions.some((session) => session.id === state.activeSessionId)

        set({
          sessions: repairedSessions,
          activeSessionId: hasActiveSession ? state.activeSessionId : repairedSessions[0]?.id,
          initialized: true,
        })
      },

      setHydrated: (hydrated) => {
        set({ hydrated })
      },

      createSession: (name) => {
        const sessionName = name?.trim() || `Session ${get().sessions.length + 1}`
        const session = createSessionRecord(sessionName)

        set((state) => ({
          sessions: [...state.sessions, session],
          activeSessionId: session.id,
          showSessionPalette: false,
        }))

        return session.id
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const remainingSessions = state.sessions.filter((session) => session.id !== sessionId)

          if (remainingSessions.length === 0) {
            const fallbackSession = createSessionRecord()
            return {
              sessions: [fallbackSession],
              activeSessionId: fallbackSession.id,
            }
          }

          const nextActiveSessionId =
            state.activeSessionId === sessionId
              ? remainingSessions[0].id
              : state.activeSessionId

          return {
            sessions: remainingSessions,
            activeSessionId: nextActiveSessionId,
          }
        })
      },

      setActiveSession: (sessionId) => {
        set({ activeSessionId: sessionId })
      },

      createTab: (sessionId, name = 'New Tab', model = DEFAULT_MODEL) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session
            }

            if (name === 'New Tab') {
              const existingEmptyTab = session.tabs.find(
                (tab) => tab.name === 'New Tab' && tab.messages.length === 0,
              )

              if (existingEmptyTab) {
                return {
                  ...session,
                  activeTabId: existingEmptyTab.id,
                  updatedAt: now(),
                }
              }
            }

            const tab = createTabRecord(name, model)

            return {
              ...session,
              tabs: [...session.tabs, tab],
              activeTabId: tab.id,
              updatedAt: now(),
            }
          }),
        }))
      },

      deleteTab: (sessionId, tabId) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session
            }

            const remainingTabs = session.tabs.filter((tab) => tab.id !== tabId)

            if (remainingTabs.length === 0) {
              const fallbackTab = createTabRecord()
              return {
                ...session,
                tabs: [fallbackTab],
                activeTabId: fallbackTab.id,
                updatedAt: now(),
              }
            }

            const nextActiveTabId = session.activeTabId === tabId ? remainingTabs[0].id : session.activeTabId

            return {
              ...session,
              tabs: remainingTabs,
              activeTabId: nextActiveTabId,
              updatedAt: now(),
            }
          }),
        }))
      },

      setActiveTab: (sessionId, tabId) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, activeTabId: tabId, updatedAt: now() }
              : session,
          ),
        }))
      },

      updateTab: (sessionId, tabId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  tabs: session.tabs.map((tab) =>
                    tab.id === tabId ? { ...tab, ...updates } : tab,
                  ),
                  updatedAt: now(),
                }
              : session,
          ),
        }))
      },

      renameTab: (sessionId, tabId, newName) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  tabs: session.tabs.map((tab) =>
                    tab.id === tabId ? { ...tab, name: newName.trim() || 'Untitled' } : tab,
                  ),
                  updatedAt: now(),
                }
              : session,
          ),
        }))
      },

      renameSession: (sessionId, newName) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, name: newName.trim() || 'Untitled Session', updatedAt: now() }
              : session,
          ),
        }))
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
      },

      setShowSettings: (show) => {
        set({ showSettings: show })
      },

      setShowSessionPalette: (show) => {
        set({ showSessionPalette: show })
      },

      setShowSearchPalette: (show) => {
        set({ showSearchPalette: show })
      },
    }),
    {
      name: 'holocron-chat-store',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)
