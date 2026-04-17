import { create } from 'zustand'
import type { Provider } from './models'

interface APIKeyStore {
  provider: Provider
  googleKey: string
  openrouterKey: string
  setProvider: (provider: Provider) => void
  setGoogleKey: (key: string) => void
  setOpenRouterKey: (key: string) => void
  clearGoogleKey: () => void
  clearOpenRouterKey: () => void
  // Convenience getters
  apiKey: string
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

export const useAPIKeyStore = create<APIKeyStore>((set, get) => ({
  provider: 'google',
  googleKey: '',
  openrouterKey: '',

  setProvider: (provider) => set({ provider }),
  setGoogleKey: (key) => set({ googleKey: key.trim() }),
  setOpenRouterKey: (key) => set({ openrouterKey: key.trim() }),
  clearGoogleKey: () => set({ googleKey: '' }),
  clearOpenRouterKey: () => set({ openrouterKey: '' }),

  // `apiKey` returns the key for the currently active provider
  get apiKey() {
    const state = get()
    return state.provider === 'google' ? state.googleKey : state.openrouterKey
  },

  // `setApiKey` sets the key for the currently active provider
  setApiKey: (key) => {
    const { provider } = get()
    if (provider === 'google') {
      set({ googleKey: key.trim() })
    } else {
      set({ openrouterKey: key.trim() })
    }
  },

  // `clearApiKey` clears the key for the currently active provider
  clearApiKey: () => {
    const { provider } = get()
    if (provider === 'google') {
      set({ googleKey: '' })
    } else {
      set({ openrouterKey: '' })
    }
  },
}))
