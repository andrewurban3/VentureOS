export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SystemBlock {
  type: 'text'
  text: string
  cache_control?: { type: 'ephemeral' }
}

export interface WebCitation {
  url: string
  title: string
  citedText: string
}

export interface ChatResponse {
  text: string
  webCitations: WebCitation[]
}

export interface AIProvider {
  id: string
  name: string

  chat(params: {
    systemPrompt: string | SystemBlock[]
    messages: ChatMessage[]
    maxTokens?: number
    tools?: { type: string; name: string; max_uses?: number }[]
  }): Promise<ChatResponse>

  chatWithStructuredOutput<T>(params: {
    systemPrompt: string | SystemBlock[]
    messages: ChatMessage[]
    maxTokens?: number
    schemaHint?: string
  }): Promise<T>
}
