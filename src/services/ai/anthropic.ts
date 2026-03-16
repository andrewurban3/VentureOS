import type { AIProvider, SystemBlock, ChatResponse, WebCitation } from './types'

const MODEL = 'claude-sonnet-4-20250514'
const MAX_RETRIES = 2
const RETRY_BASE_MS = 2000

function stripJsonFences(raw: string): string {
  return raw
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()
}

export function parseJsonFromResponse<T>(raw: string): T {
  const cleaned = stripJsonFences(raw)
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7526/ingest/2e1cc1bb-e928-47a7-9500-4d4a43c53b51',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f586c6'},body:JSON.stringify({sessionId:'f586c6',location:'anthropic.ts:parseJsonFromResponse',message:'JSON parse failed',data:{error:String(e),rawPreview:raw?.slice(0,200)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        throw new Error(`Failed to parse JSON from AI response: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }
    // #region agent log
    fetch('http://127.0.0.1:7526/ingest/2e1cc1bb-e928-47a7-9500-4d4a43c53b51',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f586c6'},body:JSON.stringify({sessionId:'f586c6',location:'anthropic.ts:parseJsonFromResponse',message:'No JSON in response',data:{rawPreview:raw?.slice(0,200)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    throw new Error('No JSON object found in AI response')
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface RawCitation {
  type?: string
  url?: string
  title?: string
  cited_text?: string
}

interface RawContentBlock {
  type: string
  text?: string
  citations?: RawCitation[]
}

async function callAnthropic(body: Record<string, unknown>): Promise<ChatResponse> {
  const url = '/api/anthropic'

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const data = await response.json()
      const content: RawContentBlock[] = data.content ?? []
      const textBlocks = content.filter((b) => b.type === 'text')
      const text = textBlocks.map((b) => b.text ?? '').join('')

      const seen = new Set<string>()
      const webCitations: WebCitation[] = []
      for (const block of textBlocks) {
        for (const c of block.citations ?? []) {
          if (c.type === 'web_search_result_location' && c.url && !seen.has(c.url)) {
            seen.add(c.url)
            webCitations.push({
              url: c.url,
              title: c.title ?? '',
              citedText: c.cited_text ?? '',
            })
          }
        }
      }

      return { text, webCitations }
    }

    const errText = await response.text()

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = parseInt(response.headers.get('retry-after') ?? '', 10)
      const waitMs = retryAfter ? retryAfter * 1000 : RETRY_BASE_MS * Math.pow(2, attempt)
      await sleep(waitMs)
      lastError = new Error(`Rate limited (attempt ${attempt + 1})`)
      continue
    }

    throw new Error(`Anthropic API error: ${response.status} - ${errText}`)
  }

  throw lastError ?? new Error('Anthropic API: max retries exceeded')
}

export const anthropicProvider: AIProvider = {
  id: 'anthropic',
  name: 'Anthropic (Claude)',

  async chat({ systemPrompt, messages, maxTokens = 1000, tools }) {
    const system: string | SystemBlock[] =
      typeof systemPrompt === 'string'
        ? systemPrompt
        : systemPrompt

    const body: Record<string, unknown> = {
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    }
    if (tools?.length) body.tools = tools

    return callAnthropic(body)
  },

  async chatWithStructuredOutput<T>({
    systemPrompt,
    messages,
    maxTokens = 2000,
  }: Parameters<AIProvider['chatWithStructuredOutput']>[0]): Promise<T> {
    const jsonInstruction = '\n\nReturn ONLY valid JSON. No markdown fences, no extra text.'
    const system: string | SystemBlock[] =
      typeof systemPrompt === 'string'
        ? systemPrompt + jsonInstruction
        : [...systemPrompt, { type: 'text', text: jsonInstruction }]
    const resp = await anthropicProvider.chat({
      systemPrompt: system,
      messages,
      maxTokens,
    })
    return parseJsonFromResponse<T>(resp.text)
  },
}
