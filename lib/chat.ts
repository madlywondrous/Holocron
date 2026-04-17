import type { UIMessage } from 'ai'
import { DEFAULT_MODEL, isSupportedModel } from '@/lib/models'

export interface ChatMessageMetadata {
  createdAt?: string
  model?: string
}

export type ChatMessage = UIMessage<ChatMessageMetadata>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeTimestamp(value: unknown): string {
  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return new Date().toISOString()
}

export function normalizeStoredMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) {
    return null
  }

  const role = value.role
  if (role !== 'user' && role !== 'assistant' && role !== 'system') {
    return null
  }

  const metadata = isRecord(value.metadata) ? value.metadata : {}
  const createdAt = normalizeTimestamp(metadata.createdAt ?? value.timestamp)
  const legacyModel = typeof value.model === 'string' ? value.model : undefined
  const metadataModel = typeof metadata.model === 'string' ? metadata.model : undefined
  const model = metadataModel ?? legacyModel

  const parts = Array.isArray(value.parts)
    ? value.parts
    : typeof value.content === 'string'
      ? [{ type: 'text', text: value.content }]
      : []

  return {
    id: typeof value.id === 'string' && value.id.length > 0 ? value.id : crypto.randomUUID(),
    role,
    metadata: {
      createdAt,
      model: model ? (isSupportedModel(model) ? model : DEFAULT_MODEL) : undefined,
    },
    parts: parts as ChatMessage['parts'],
  }
}

export function getMessageText(message: Pick<ChatMessage, 'parts'>): string {
  return message.parts
    .filter((part): part is Extract<ChatMessage['parts'][number], { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

export function getMessageTimestamp(message: ChatMessage): string | null {
  return message.metadata?.createdAt ?? null
}
