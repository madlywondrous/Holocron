import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, streamText } from 'ai'
import type { ChatMessage, ChatMessageMetadata } from '@/lib/chat'
import { isSupportedModel, getProviderForModel } from '@/lib/models'

export const maxDuration = 60

// Simple in-memory rate limiter: max 20 requests per minute per API key
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20

function checkRateLimit(key: string): boolean {
  const now = Date.now()

  if (rateLimitMap.size > 100) {
    for (const [k, entry] of rateLimitMap) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(k)
      }
    }
  }

  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

function createModelInstance(provider: string, modelId: string, apiKey: string) {
  if (provider === 'openrouter') {
    const openrouter = createOpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    })
    return openrouter(modelId)
  }

  // Default: Google
  const google = createGoogleGenerativeAI({ apiKey })
  return google(modelId)
}

// The Google and OpenAI providers return different model version types
// (v2 vs v3) but streamText handles both at runtime.
// eslint-disable-next-line -- bridge type for cross-provider compatibility
type AnyModel = Parameters<typeof streamText>[0]['model']

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = Array.isArray(body.messages) ? (body.messages as ChatMessage[]) : []
    const model = typeof body.model === 'string' ? body.model : ''

    if (!isSupportedModel(model)) {
      return Response.json({ error: 'Unsupported model.' }, { status: 400 })
    }

    const provider = getProviderForModel(model)

    // Read the appropriate API key from headers
    const apiKey = provider === 'openrouter'
      ? req.headers.get('X-OpenRouter-API-Key')?.trim()
      : req.headers.get('X-Google-API-Key')?.trim()

    if (!apiKey) {
      return Response.json(
        { error: `${provider === 'openrouter' ? 'OpenRouter' : 'Google AI'} API key is required.` },
        { status: 401 },
      )
    }

    if (!checkRateLimit(apiKey)) {
      return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const assistantMetadata: ChatMessageMetadata = {
      createdAt: new Date().toISOString(),
      model,
    }

    const result = streamText({
      model: createModelInstance(provider, model, apiKey) as AnyModel,
      messages: convertToModelMessages(messages),
      system:
        'You are Holocron, a clear and practical AI assistant. Use concise markdown and short paragraphs when helpful.',
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse<ChatMessage>({
      originalMessages: messages,
      messageMetadata: ({ part }) => {
        if (part.type === 'start' || part.type === 'finish') {
          return assistantMetadata
        }

        return undefined
      },
      onError: (error) => {
        console.error('Chat API error:', error)
        return 'Something went wrong while generating a response.'
      },
    })
  } catch (error) {
    console.error('Chat route failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Invalid chat request.'
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
