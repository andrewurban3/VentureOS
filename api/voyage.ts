import type { VercelRequest, VercelResponse } from '@vercel/node'

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'VOYAGE_API_KEY is not configured' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const response = await fetch(VOYAGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      res.status(response.status).json(data)
      return
    }

    res.status(200).json(data)
  } catch (err) {
    console.error('Voyage proxy error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Voyage proxy failed',
    })
  }
}
