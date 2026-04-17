'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Key, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAPIKeyStore } from '@/lib/api-key-store'
import { GOOGLE_MODELS, OPENROUTER_SUGGESTIONS } from '@/lib/models'
import type { Provider } from '@/lib/models'
import { cn } from '@/lib/utils'

interface SettingsPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPopup({ isOpen, onClose }: SettingsPopupProps) {
  const { provider, setProvider, googleKey, openrouterKey, setGoogleKey, setOpenRouterKey, clearGoogleKey, clearOpenRouterKey } = useAPIKeyStore()
  const [draftGoogleKey, setDraftGoogleKey] = useState('')
  const [draftOpenRouterKey, setDraftOpenRouterKey] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setDraftGoogleKey(googleKey)
    setDraftOpenRouterKey(openrouterKey)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [googleKey, openrouterKey, isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const googleConnected = googleKey.trim().length > 0
  const openrouterConnected = openrouterKey.trim().length > 0
  const googleHasChanges = draftGoogleKey !== googleKey
  const openrouterHasChanges = draftOpenRouterKey !== openrouterKey

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background shadow-xl">
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

        <div className="space-y-6 p-6">
          {/* Provider Toggle */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active Provider</h3>
            <div className="flex gap-2">
              <ProviderButton
                label="Google AI"
                sublabel="Direct Gemini access"
                active={provider === 'google'}
                connected={googleConnected}
                onClick={() => setProvider('google')}
              />
              <ProviderButton
                label="OpenRouter"
                sublabel="Multi-model gateway"
                active={provider === 'openrouter'}
                connected={openrouterConnected}
                onClick={() => setProvider('openrouter')}
              />
            </div>
          </div>

          {/* Google AI Key */}
          <div className={cn('rounded-lg border p-4 transition-all', provider === 'google' ? 'border-primary/50 bg-primary/5' : 'opacity-70')}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Key className="h-5 w-5" />
                  Google AI API Key
                </h3>
                <p className="text-sm text-muted-foreground">
                  For Gemini 2.5 Flash and Gemini 2.5 Pro.
                </p>
              </div>
              <StatusBadge connected={googleConnected} />
            </div>

            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Enter your Google AI key"
                value={draftGoogleKey}
                onChange={(event) => setDraftGoogleKey(event.target.value)}
                className="font-mono"
              />

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setGoogleKey(draftGoogleKey)} disabled={!draftGoogleKey.trim() || !googleHasChanges}>
                  Save Key
                </Button>
                {googleConnected && (
                  <Button variant="outline" onClick={() => {
                    clearGoogleKey()
                    setDraftGoogleKey('')
                  }}>
                    Clear Key
                  </Button>
                )}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Get Key →
                </a>
              </div>
            </div>
          </div>

          {/* OpenRouter Key */}
          <div className={cn('rounded-lg border p-4 transition-all', provider === 'openrouter' ? 'border-primary/50 bg-primary/5' : 'opacity-70')}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Key className="h-5 w-5" />
                  OpenRouter API Key
                </h3>
                <p className="text-sm text-muted-foreground">
                  Access Claude, GPT-4o, DeepSeek, Llama, and more.
                </p>
              </div>
              <StatusBadge connected={openrouterConnected} />
            </div>

            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Enter your OpenRouter key (sk-or-...)"
                value={draftOpenRouterKey}
                onChange={(event) => setDraftOpenRouterKey(event.target.value)}
                className="font-mono"
              />

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setOpenRouterKey(draftOpenRouterKey)} disabled={!draftOpenRouterKey.trim() || !openrouterHasChanges}>
                  Save Key
                </Button>
                {openrouterConnected && (
                  <Button variant="outline" onClick={() => {
                    clearOpenRouterKey()
                    setDraftOpenRouterKey('')
                  }}>
                    Clear Key
                  </Button>
                )}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Get Key →
                </a>
              </div>
            </div>
          </div>

          {/* Models list */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Available Models
            </h3>

            {provider === 'google' ? (
              <div className="flex flex-wrap gap-2">
                {GOOGLE_MODELS.map((model, index) => (
                  <div key={model.id} className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                    {index === 0 ? <Zap className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {model.label}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {OPENROUTER_SUGGESTIONS.map((model) => (
                    <div key={model.id} className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      {model.label}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/70">
                  These are presets. Click <strong>Custom</strong> in the model selector to use any OpenRouter slug
                  (e.g. <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-xs">google/gemma-4-27b-it:free</code>).
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Keys are kept in memory only. Refreshing or closing the app clears them.
          </p>
        </div>
      </div>
    </div>
  )
}

function ProviderButton({ label, sublabel, active, connected, onClick }: {
  label: string
  sublabel: string
  active: boolean
  connected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 rounded-lg border-2 p-3 text-left transition-all duration-200',
        active
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border/60 bg-card/50 hover:border-border hover:bg-muted/30',
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('text-base font-semibold', active ? 'text-primary' : 'text-foreground')}>{label}</span>
        {connected && <CheckCircle className="h-4 w-4 text-green-500" />}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
    </button>
  )
}

function StatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span className="flex items-center gap-1 rounded border border-green-500/20 bg-green-500/10 px-2 py-1 text-sm text-green-600">
        <CheckCircle className="h-3 w-3" />
        Connected
      </span>
    )
  }

  return (
    <span className="rounded border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-sm text-yellow-600">
      Missing key
    </span>
  )
}
