import type { AIProvider } from './types'
import { anthropicProvider } from './anthropic'

const providers: Record<string, AIProvider> = {
  anthropic: anthropicProvider,
}

const defaultProviderId = import.meta.env.VITE_AI_PROVIDER ?? 'anthropic'

export function getAIProvider(): AIProvider {
  const provider = providers[defaultProviderId]
  if (!provider) {
    throw new Error(`AI provider "${defaultProviderId}" not found. Available: ${Object.keys(providers).join(', ')}`)
  }
  return provider
}

export const aiService = {
  async chat(params: Parameters<AIProvider['chat']>[0]) {
    return getAIProvider().chat(params)
  },
  async chatWithStructuredOutput<T>(params: Parameters<AIProvider['chatWithStructuredOutput']>[0]) {
    return getAIProvider().chatWithStructuredOutput<T>(params)
  },
}

export type { AIProvider, ChatMessage, ChatResponse, WebCitation } from './types'
