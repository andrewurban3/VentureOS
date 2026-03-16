import type { VercelRequest, VercelResponse } from '@vercel/node'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
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
    console.error('Anthropic proxy error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Anthropic proxy failed',
    })
  }
}
