'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAPIKeyStore } from '@/lib/api-key-store'
import { getModelsForProvider } from '@/lib/models'
import type { Provider } from '@/lib/models'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/lib/store'

export function SettingsView() {
  const store = useAPIKeyStore()
  const { provider, setProvider } = store
  const showSettings = useChatStore(s => s.showSettings)
  const setShowSettings = useChatStore(s => s.setShowSettings)
  
  const [draftKeys, setDraftKeys] = useState<Record<Provider, string>>({
    google: '',
    openrouter: '',
    openai: '',
    anthropic: '',
    xai: '',
    groq: ''
  })
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (!showSettings) return

    setDraftKeys({
      google: store.googleKey,
      openrouter: store.openrouterKey,
      openai: store.openaiKey,
      anthropic: store.anthropicKey,
      xai: store.xaiKey,
      groq: store.groqKey
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSettings(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    showSettings, 
    setShowSettings,
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
  
  const keyMap = useMemo(() => ({
    google: { get: store.googleKey, set: store.setGoogleKey, clear: store.clearGoogleKey },
    openrouter: { get: store.openrouterKey, set: store.setOpenRouterKey, clear: store.clearOpenRouterKey },
    openai: { get: store.openaiKey, set: store.setOpenAIKey, clear: store.clearOpenAIKey },
    anthropic: { get: store.anthropicKey, set: store.setAnthropicKey, clear: store.clearAnthropicKey },
    xai: { get: store.xaiKey, set: store.setXaiKey, clear: store.clearXaiKey },
    groq: { get: store.groqKey, set: store.setGroqKey, clear: store.clearGroqKey },
  }), [store])

  const isConnected = keyMap[provider].get.trim().length > 0
  const hasChanges = draftKeys[provider] !== keyMap[provider].get

  if (!showSettings) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200">
      <header className="flex h-14 items-center justify-between border-b border-border/50 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" onClick={() => setShowSettings(false)} className="h-8 w-8">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Button>
          <h1 className="text-lg font-medium tracking-wide">Settings</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 p-6 md:flex-row md:p-12">
          
          {/* Left: Navigation Menu */}
          <div className="w-full md:w-64 flex-shrink-0">
            <h2 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">AI Providers</h2>
            <div className="flex flex-col space-y-1">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                    provider === p.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span>{p.label}</span>
                  {keyMap[p.id].get.trim().length > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Content Area */}
          <div className="flex-1 min-w-0 max-w-3xl space-y-6">
            
            {/* Header Section */}
            <div className="space-y-0.5">
              <h2 className="text-xl font-semibold tracking-tight">{activeProviderData.label} Configuration</h2>
              <p className="text-sm text-muted-foreground">{activeProviderData.sublabel}</p>
            </div>

            <div className="h-px w-full bg-border/50" />

            {/* API Key Form */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  API Key
                </label>
                {isConnected ? (
                   <span className="text-[11px] font-medium text-green-500 uppercase tracking-wider">CONNECTED</span>
                ) : (
                   <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">NOT CONNECTED</span>
                )}
              </div>
              
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={`e.g. ${activeProviderData.placeholder}`}
                  value={draftKeys[provider]}
                  onChange={(event) => setDraftKeys(prev => ({ ...prev, [provider]: event.target.value }))}
                  className="h-9 font-mono bg-background/50 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title={showKey ? "Hide key" : "Show key"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showKey ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button 
                  size="sm"
                  onClick={() => keyMap[provider].set(draftKeys[provider])} 
                  disabled={!draftKeys[provider].trim() || !hasChanges}
                  className="h-8 min-w-20 text-xs"
                >
                  Save
                </Button>
                {isConnected && (
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => {
                      keyMap[provider].clear()
                      setDraftKeys(prev => ({ ...prev, [provider]: '' }))
                    }}
                    className="h-8 text-xs"
                  >
                    Clear
                  </Button>
                )}
                <div className="flex-1" />
                <a
                  href={activeProviderData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4"
                >
                  Get API key ↗
                </a>
              </div>
            </div>

            <div className="h-px w-full bg-border/50" />

            {/* Included Models */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Available Models</h3>
              <div className="flex flex-wrap gap-1.5">
                {getModelsForProvider(provider).map((model) => (
                  <div 
                    key={model.id} 
                    className="inline-flex items-center rounded border border-border/50 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-foreground/80 transition-colors"
                  >
                    {model.label}
                  </div>
                ))}
              </div>
              {provider === 'openrouter' && (
                <p className="text-[12px] leading-snug text-muted-foreground mt-1.5">
                  Plus thousands more. Type any valid OpenRouter model slug (e.g., <code className="rounded bg-muted px-1 py-px font-mono text-[10px]">google/gemma-2-9b-it</code>) directly into the chat model selector.
                </p>
              )}
            </div>

            {/* Security Notice */}
            <div className="rounded border border-border/40 bg-muted/20 p-3 mt-6">
              <p className="text-[12px] leading-snug text-muted-foreground">
                <strong className="font-medium text-foreground">Local Storage Only:</strong> Your API keys are stored securely in your browser&apos;s IndexedDB. They never leave your device except when sending direct requests to the configured AI provider.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
