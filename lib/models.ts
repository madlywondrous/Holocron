export type Provider = 'google' | 'openrouter'

export interface ModelInfo {
  id: string
  label: string
  provider: Provider
}

// Google models are fixed — we know exactly what's available
export const GOOGLE_MODELS: ModelInfo[] = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'google' },
]

// OpenRouter suggestions — just common starting points, not exhaustive.
// Users can type any slug they want (e.g. "google/gemma-4-31b-it:free").
export const OPENROUTER_SUGGESTIONS: ModelInfo[] = [
  { id: 'google/gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash', provider: 'openrouter' },
  { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', provider: 'openrouter' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', provider: 'openrouter' },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1', provider: 'openrouter' },
  { id: 'google/gemma-4-27b-it:free', label: 'Gemma 4 27B (free)', provider: 'openrouter' },
]

export const MODEL_CATALOG: ModelInfo[] = [...GOOGLE_MODELS, ...OPENROUTER_SUGGESTIONS]

export const DEFAULT_MODEL = GOOGLE_MODELS[0].id

export function getModelInfo(modelId: string): ModelInfo {
  const found = MODEL_CATALOG.find((model) => model.id === modelId)
  if (found) return found

  // For custom OpenRouter slugs not in the catalog, generate a label
  return { id: modelId, label: modelId, provider: 'openrouter' }
}

export function isSupportedModel(modelId: string): boolean {
  // Google models must be in the catalog; OpenRouter accepts any slug
  return MODEL_CATALOG.some((model) => model.id === modelId) || modelId.includes('/')
}

export function getModelsForProvider(provider: Provider): ModelInfo[] {
  if (provider === 'google') return GOOGLE_MODELS
  return OPENROUTER_SUGGESTIONS
}

export function getProviderForModel(modelId: string): Provider {
  if (GOOGLE_MODELS.some((m) => m.id === modelId)) return 'google'
  return modelId.includes('/') ? 'openrouter' : 'google'
}
