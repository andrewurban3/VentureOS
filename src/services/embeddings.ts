const MODEL = 'voyage-3-lite'
const MAX_BATCH = 128
const VOYAGE_API_PATH = '/api/voyage'

interface VoyageResponse {
  data: { embedding: number[] }[]
  usage: { total_tokens: number }
}

export async function embedText(text: string): Promise<number[]> {
  const [result] = await embedBatch([text])
  return result
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  if (texts.length > MAX_BATCH) {
    const results: number[][] = []
    for (let i = 0; i < texts.length; i += MAX_BATCH) {
      const chunk = texts.slice(i, i + MAX_BATCH)
      const chunkResults = await embedBatch(chunk)
      results.push(...chunkResults)
    }
    return results
  }

  const resp = await fetch(VOYAGE_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      input: texts,
      input_type: 'document',
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Voyage AI error: ${resp.status} - ${errText}`)
  }

  const data: VoyageResponse = await resp.json()
  return data.data.map((d) => d.embedding)
}

export async function embedQuery(text: string): Promise<number[]> {
  const resp = await fetch(VOYAGE_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      input: [text],
      input_type: 'query',
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Voyage AI error: ${resp.status} - ${errText}`)
  }

  const data: VoyageResponse = await resp.json()
  return data.data[0].embedding
}
