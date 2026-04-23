import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { convertToModelMessages, streamText } from 'ai'
import type { ChatMessage, ChatMessageMetadata } from '@/lib/chat'
import { isSupportedModel, getProviderForModel } from '@/lib/models'

export const runtime = 'edge'
export const maxDuration = 60

// Simple in-memory rate limiter: max 20 requests per minute per API key
// (Keeping this for basic flood protection, even though it's a local app)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 50 // Increased for local use

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
  switch (provider) {
    case 'openrouter': {
      const openrouter = createOpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        compatibility: 'compatible',
        headers: {
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Holocron Chat',
        }
      })
      return openrouter(modelId)
    }
    case 'openai': {
      const openai = createOpenAI({ apiKey })
      return openai(modelId)
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey })
      return anthropic(modelId)
    }
    case 'xai': {
      const xai = createXai({ apiKey })
      return xai(modelId)
    }
    case 'groq': {
      const groq = createOpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
        compatibility: 'compatible',
      })
      return groq(modelId)
    }
    case 'google':
    default: {
      const google = createGoogleGenerativeAI({ apiKey })
      return google(modelId)
    }
  }
}

// eslint-disable-next-line -- bridge type for cross-provider compatibility
type AnyModel = Parameters<typeof streamText>[0]['model']

const PROVIDER_HEADER_MAP: Record<string, string> = {
  google: 'X-Google-API-Key',
  openrouter: 'X-OpenRouter-API-Key',
  openai: 'X-OpenAI-API-Key',
  anthropic: 'X-Anthropic-API-Key',
  xai: 'X-xAI-API-Key',
  groq: 'X-Groq-API-Key'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages = Array.isArray(body.messages) ? (body.messages as ChatMessage[]) : []
    const model = typeof body.model === 'string' ? body.model : ''

    if (!isSupportedModel(model)) {
      return Response.json({ error: 'Unsupported model.' }, { status: 400 })
    }

    const provider = getProviderForModel(model)

    // Read the appropriate API key from headers based on the provider
    const headerName = PROVIDER_HEADER_MAP[provider]
    const apiKey = (headerName ? req.headers.get(headerName) : '')?.trim()

    if (!apiKey) {
      return Response.json(
        { error: `API key for ${provider} is required.` },
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
        'You are Holocron, a clear and practical AI assistant. Use concise markdown and short paragraphs when helpful. Provide detailed answers to complex topics.',
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
