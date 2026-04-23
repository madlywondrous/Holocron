export type Provider = 'google' | 'openrouter' | 'openai' | 'anthropic' | 'xai' | 'groq'

export interface ModelInfo {
  id: string
  label: string
  provider: Provider
}

export const GOOGLE_MODELS: ModelInfo[] = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'google' },
]

export const OPENAI_MODELS: ModelInfo[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
  { id: 'o1', label: 'o1', provider: 'openai' },
  { id: 'o3-mini', label: 'o3-mini', provider: 'openai' },
]

export const ANTHROPIC_MODELS: ModelInfo[] = [
  { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus', provider: 'anthropic' },
]

export const XAI_MODELS: ModelInfo[] = [
  { id: 'grok-2-1212', label: 'Grok 2', provider: 'xai' },
  { id: 'grok-beta', label: 'Grok Beta', provider: 'xai' },
]

export const GROQ_MODELS: ModelInfo[] = [
  { id: 'llama3-70b-8192', label: 'Llama 3 70B', provider: 'groq' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', provider: 'groq' },
]

export const OPENROUTER_SUGGESTIONS: ModelInfo[] = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (OR)', provider: 'openrouter' },
  { id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet (OR)', provider: 'openrouter' },
  { id: 'openai/gpt-4o', label: 'GPT-4o (OR)', provider: 'openrouter' },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1', provider: 'openrouter' },
  { id: 'google/gemma-2-27b-it', label: 'Gemma 2 27B', provider: 'openrouter' },
]

export const MODEL_CATALOG: ModelInfo[] = [
  ...GOOGLE_MODELS,
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...XAI_MODELS,
  ...GROQ_MODELS,
  ...OPENROUTER_SUGGESTIONS,
]

export const DEFAULT_MODEL = GOOGLE_MODELS[0].id

export function getModelInfo(modelId: string): ModelInfo {
  const found = MODEL_CATALOG.find((model) => model.id === modelId)
  if (found) return found

  // For custom OpenRouter slugs not in the catalog
  if (modelId.includes('/')) {
    return { id: modelId, label: modelId, provider: 'openrouter' }
  }

  // Fallback
  return { id: modelId, label: modelId, provider: 'openai' }
}

export function isSupportedModel(modelId: string): boolean {
  return MODEL_CATALOG.some((model) => model.id === modelId) || modelId.includes('/')
}

export function getModelsForProvider(provider: Provider): ModelInfo[] {
  switch (provider) {
    case 'google': return GOOGLE_MODELS
    case 'openai': return OPENAI_MODELS
    case 'anthropic': return ANTHROPIC_MODELS
    case 'xai': return XAI_MODELS
    case 'groq': return GROQ_MODELS
    case 'openrouter': return OPENROUTER_SUGGESTIONS
    default: return []
  }
}

export function getProviderForModel(modelId: string): Provider {
  const model = MODEL_CATALOG.find((m) => m.id === modelId)
  if (model) return model.provider
  
  if (modelId.includes('/')) return 'openrouter'
  
  // Best guess fallback
  if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) return 'openai'
  if (modelId.startsWith('claude')) return 'anthropic'
  if (modelId.startsWith('gemini')) return 'google'
  if (modelId.startsWith('grok')) return 'xai'
  
  return 'openai'
}
