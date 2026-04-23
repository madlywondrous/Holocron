'use client'

import { useEffect, useState, useMemo } from 'react'
import { CheckCircle, Key, ShieldCheck, Sparkles, Zap, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAPIKeyStore } from '@/lib/api-key-store'
import { getModelsForProvider } from '@/lib/models'
import type { Provider } from '@/lib/models'
import { cn } from '@/lib/utils'

interface SettingsPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPopup({ isOpen, onClose }: SettingsPopupProps) {
  const store = useAPIKeyStore()
  const { provider, setProvider } = store
  
  // Local draft states for all keys
  const [draftKeys, setDraftKeys] = useState<Record<Provider, string>>({
    google: '',
    openrouter: '',
    openai: '',
    anthropic: '',
    xai: '',
    groq: ''
  })

  useEffect(() => {
    if (!isOpen) return

    setDraftKeys({
      google: store.googleKey,
      openrouter: store.openrouterKey,
      openai: store.openaiKey,
      anthropic: store.anthropicKey,
      xai: store.xaiKey,
      groq: store.groqKey
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isOpen, 
    onClose, 
    store.googleKey, 
    store.openrouterKey, 
    store.openaiKey, 
    store.anthropicKey, 
    store.xaiKey, 
    store.groqKey
  ])



  const providers = useMemo(() => [
    { id: 'openai' as Provider, label: 'OpenAI', sublabel: 'GPT-4o, o1, o3-mini', url: 'https://platform.openai.com/api-keys', placeholder: 'sk-proj-...' },
    { id: 'anthropic' as Provider, label: 'Anthropic', sublabel: 'Claude 3.7 Sonnet', url: 'https://console.anthropic.com/settings/keys', placeholder: 'sk-ant-...' },
    { id: 'google' as Provider, label: 'Google AI', sublabel: 'Gemini 1.5/2.5', url: 'https://aistudio.google.com/app/apikey', placeholder: 'AIzaSy...' },
    { id: 'xai' as Provider, label: 'xAI', sublabel: 'Grok 2', url: 'https://console.x.ai/', placeholder: 'xai-...' },
    { id: 'groq' as Provider, label: 'Groq', sublabel: 'Fast Llama/Mixtral', url: 'https://console.groq.com/keys', placeholder: 'gsk_...' },
    { id: 'openrouter' as Provider, label: 'OpenRouter', sublabel: 'Multi-model gateway', url: 'https://openrouter.ai/keys', placeholder: 'sk-or-v1-...' },
  ], [])

  const activeProviderData = useMemo(() => providers.find(p => p.id === provider)!, [providers, provider])
  
  // Dynamic getter/setter mappings
  const keyMap = useMemo(() => ({
    google: { get: store.googleKey, set: store.setGoogleKey, clear: store.clearGoogleKey },
    openrouter: { get: store.openrouterKey, set: store.setOpenRouterKey, clear: store.clearOpenRouterKey },
    openai: { get: store.openaiKey, set: store.setOpenAIKey, clear: store.clearOpenAIKey },
    anthropic: { get: store.anthropicKey, set: store.setAnthropicKey, clear: store.clearAnthropicKey },
    xai: { get: store.xaiKey, set: store.setXaiKey, clear: store.clearXaiKey },
    groq: { get: store.groqKey, set: store.setGroqKey, clear: store.clearGroqKey },
  }), [store.googleKey, store.openrouterKey, store.openaiKey, store.anthropicKey, store.xaiKey, store.groqKey, store.setGoogleKey, store.setOpenRouterKey, store.setOpenAIKey, store.setAnthropicKey, store.setXaiKey, store.setGroqKey, store.clearGoogleKey, store.clearOpenRouterKey, store.clearOpenAIKey, store.clearAnthropicKey, store.clearXaiKey, store.clearGroqKey])

  const isConnected = keyMap[provider].get.trim().length > 0
  const hasChanges = draftKeys[provider] !== keyMap[provider].get

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-background shadow-xl">
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Settings</h2>
              <p className="text-sm text-muted-foreground">Configure your AI provider and API keys.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row min-h-[400px]">
          {/* Provider Sidebar */}
          <div className="w-full md:w-1/3 border-r bg-muted/10 p-4 space-y-2">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2">Providers</h3>
            {providers.map((p) => (
              <ProviderButton
                key={p.id}
                label={p.label}
                active={provider === p.id}
                connected={keyMap[p.id].get.trim().length > 0}
                onClick={() => setProvider(p.id)}
              />
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 space-y-6">
            
            {/* API Key Section */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Key className="h-5 w-5" />
                    {activeProviderData.label} API Key
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {activeProviderData.sublabel}
                  </p>
                </div>
                <StatusBadge connected={isConnected} />
              </div>

              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder={`e.g. ${activeProviderData.placeholder}`}
                  value={draftKeys[provider]}
                  onChange={(event) => setDraftKeys(prev => ({ ...prev, [provider]: event.target.value }))}
                  className="font-mono bg-background"
                />

                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => keyMap[provider].set(draftKeys[provider])} 
                    disabled={!draftKeys[provider].trim() || !hasChanges}
                  >
                    Save Key
                  </Button>
                  {isConnected && (
                    <Button variant="outline" onClick={() => {
                      keyMap[provider].clear()
                      setDraftKeys(prev => ({ ...prev, [provider]: '' }))
                    }}>
                      Clear Key
                    </Button>
                  )}
                  <div className="flex-1" />
                  <a
                    href={activeProviderData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Get Key →
                  </a>
                </div>
              </div>
            </div>

            {/* Available Models preview */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Box className="h-4 w-4 text-muted-foreground" />
                Included Models
              </h3>
              <div className="flex flex-wrap gap-2">
                {getModelsForProvider(provider).map((model) => (
                  <div key={model.id} className="flex items-center gap-1.5 rounded border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {model.label}
                  </div>
                ))}
              </div>
              {provider === 'openrouter' && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Plus thousands more. Type any valid OpenRouter model slug (e.g. <code className="rounded bg-muted px-1 py-0.5">google/gemma-2-9b-it</code>) into the model selector.
                </p>
              )}
            </div>
            
            <p className="text-center text-xs text-muted-foreground pt-4 border-t">
              Keys are securely stored in your browser's IndexedDB and never leave your device except when communicating with the AI provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProviderButton({ label, active, connected, onClick }: {
  label: string
  active: boolean
  connected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span>{label}</span>
      {connected && (
        <CheckCircle className={cn('h-4 w-4', active ? 'text-primary-foreground/80' : 'text-green-500')} />
      )}
    </button>
  )
}

function StatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Connected
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
      Missing key
    </span>
  )
}
