import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from '@/lib/idb-storage'
import type { Provider } from './models'

interface APIKeyStore {
  provider: Provider
  googleKey: string
  openrouterKey: string
  openaiKey: string
  anthropicKey: string
  xaiKey: string
  groqKey: string
  
  setProvider: (provider: Provider) => void
  setGoogleKey: (key: string) => void
  setOpenRouterKey: (key: string) => void
  setOpenAIKey: (key: string) => void
  setAnthropicKey: (key: string) => void
  setXaiKey: (key: string) => void
  setGroqKey: (key: string) => void
  
  clearGoogleKey: () => void
  clearOpenRouterKey: () => void
  clearOpenAIKey: () => void
  clearAnthropicKey: () => void
  clearXaiKey: () => void
  clearGroqKey: () => void
  
  // Convenience getters
  apiKey: string
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

export const useAPIKeyStore = create<APIKeyStore>()(
  persist(
    (set, get) => ({
      provider: 'google',
      googleKey: '',
      openrouterKey: '',
      openaiKey: '',
      anthropicKey: '',
      xaiKey: '',
      groqKey: '',

      setProvider: (provider) => set({ provider }),
      setGoogleKey: (key) => set({ googleKey: key.trim() }),
      setOpenRouterKey: (key) => set({ openrouterKey: key.trim() }),
      setOpenAIKey: (key) => set({ openaiKey: key.trim() }),
      setAnthropicKey: (key) => set({ anthropicKey: key.trim() }),
      setXaiKey: (key) => set({ xaiKey: key.trim() }),
      setGroqKey: (key) => set({ groqKey: key.trim() }),

      clearGoogleKey: () => set({ googleKey: '' }),
      clearOpenRouterKey: () => set({ openrouterKey: '' }),
      clearOpenAIKey: () => set({ openaiKey: '' }),
      clearAnthropicKey: () => set({ anthropicKey: '' }),
      clearXaiKey: () => set({ xaiKey: '' }),
      clearGroqKey: () => set({ groqKey: '' }),

      get apiKey() {
        const state = get()
        switch (state.provider) {
          case 'google': return state.googleKey
          case 'openrouter': return state.openrouterKey
          case 'openai': return state.openaiKey
          case 'anthropic': return state.anthropicKey
          case 'xai': return state.xaiKey
          case 'groq': return state.groqKey
          default: return ''
        }
      },

      setApiKey: (key) => {
        const { provider } = get()
        switch (provider) {
          case 'google': return set({ googleKey: key.trim() })
          case 'openrouter': return set({ openrouterKey: key.trim() })
          case 'openai': return set({ openaiKey: key.trim() })
          case 'anthropic': return set({ anthropicKey: key.trim() })
          case 'xai': return set({ xaiKey: key.trim() })
          case 'groq': return set({ groqKey: key.trim() })
        }
      },

      clearApiKey: () => {
        const { provider } = get()
        switch (provider) {
          case 'google': return set({ googleKey: '' })
          case 'openrouter': return set({ openrouterKey: '' })
          case 'openai': return set({ openaiKey: '' })
          case 'anthropic': return set({ anthropicKey: '' })
          case 'xai': return set({ xaiKey: '' })
          case 'groq': return set({ groqKey: '' })
        }
      },
    }),
    {
      name: 'holocron-api-keys',
      storage: createJSONStorage(() => idbStorage),
    }
  )
)
