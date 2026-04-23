import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowUp, Square } from 'lucide-react'
import type { ModelInfo } from '@/lib/models'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  onModelChange?: (model: string) => void
  onStop?: () => void
  placeholder?: string
  modelId?: string
  availableModels?: ModelInfo[]
  isLoading?: boolean
  centered?: boolean
  floating?: boolean
  allowCustomModel?: boolean
}

export const MessageInput = React.memo(function MessageInput({
  onSendMessage,
  onModelChange,
  onStop,
  placeholder = 'Type your message...',
  modelId,
  availableModels = [],
  isLoading = false,
  centered = false,
  floating = false,
  allowCustomModel = false,
}: MessageInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [customModelSlug, setCustomModelSlug] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    if (!inputValue.trim() || isLoading) {
      return
    }

    onSendMessage(inputValue.trim())
    setInputValue('')
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    requestAnimationFrame(() => {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    })
  }, [inputValue])

  useEffect(() => {
    if (centered) {
      textareaRef.current?.focus()
    }
  }, [centered])

  // Check if current model is a known model or a custom slug
  const isCustomModel = modelId ? !availableModels.some((m) => m.id === modelId) : false

  const handleModelSelectChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomInput(true)
      setCustomModelSlug(isCustomModel && modelId ? modelId : '')
      return
    }
    setShowCustomInput(false)
    onModelChange?.(value)
  }

  const handleCustomModelSubmit = () => {
    const slug = customModelSlug.trim()
    if (slug && slug.includes('/')) {
      onModelChange?.(slug)
      setShowCustomInput(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="w-full"
    >
      <div
        className={cn(
          'group relative rounded-2xl border transition-all duration-200 focus-ring',
          floating
            ? 'border-border/40 bg-card/80 shadow-lg shadow-black/10 backdrop-blur-sm'
            : 'border-border bg-card shadow-sm',
          centered && 'shadow-lg',
          'hover:border-border/80 hover:shadow-lg focus-within:border-primary/50 focus-within:shadow-lg',
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <Image
            src="/holocron-icon.png"
            alt="Holocron"
            width={28}
            height={28}
            className="-mt-0.5 h-7 w-7 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
              placeholder={placeholder}
              disabled={isLoading}
              className="min-h-[20px] max-h-[150px] w-full resize-none border-none bg-transparent text-base leading-5 text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground focus:ring-0 disabled:opacity-50"
              rows={1}
              style={{ height: 'auto' }}
            />
          </div>

          {isLoading && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/80 text-destructive-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:bg-destructive hover:shadow-md focus:outline-none focus:ring-2 focus:ring-destructive/20"
              title="Stop generating"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20',
                inputValue.trim() && !isLoading
                  ? 'bg-primary text-primary-foreground shadow-sm hover:scale-105 hover:bg-primary/90 hover:shadow-md'
                  : 'cursor-not-allowed bg-muted/60 text-muted-foreground',
              )}
              title={isLoading ? 'Sending...' : 'Send message'}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {onModelChange && availableModels.length > 0 && (
          <div className="border-t border-border/50 bg-muted/30 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">Model</span>

              {showCustomInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customModelSlug}
                    onChange={(e) => setCustomModelSlug(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCustomModelSubmit()
                      } else if (e.key === 'Escape') {
                        setShowCustomInput(false)
                      }
                    }}
                    placeholder="provider/model-name"
                    autoFocus
                    className="w-52 rounded border border-border bg-background px-2 py-1 text-sm font-mono text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleCustomModelSubmit}
                    disabled={!customModelSlug.trim().includes('/')}
                    className="rounded bg-primary/80 px-2 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary disabled:opacity-40"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={isCustomModel ? '__custom__' : modelId}
                      onChange={(event) => handleModelSelectChange(event.target.value)}
                      disabled={isLoading}
                      className="appearance-none rounded bg-transparent pr-6 text-base font-medium text-foreground outline-none transition-colors hover:text-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {availableModels.map((model) => (
                        <option key={model.id} value={model.id} className="bg-card text-foreground">
                          {model.label}
                        </option>
                      ))}
                      {isCustomModel && modelId && (
                        <option value="__custom__" className="bg-card text-foreground">
                          {modelId}
                        </option>
                      )}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-0 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {allowCustomModel && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomInput(true)
                        setCustomModelSlug(isCustomModel && modelId ? modelId : '')
                      }}
                      className="rounded border border-border/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      title="Enter a custom model slug"
                    >
                      Custom
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!onModelChange && (
          <div className="pointer-events-none absolute bottom-2 left-3 text-sm text-muted-foreground/60 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100">
            Press Enter to send, Shift+Enter for new line
          </div>
        )}
      </div>
    </form>
  )
})
