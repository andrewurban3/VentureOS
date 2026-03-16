import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const EXTRACTION_PERSONA = `You are an interview analyst at KPMG. Extract structured insights from an interview transcript.

The venture has 10 Idea Intake dimensions (01 Core Concept, 02 Problem & Pain Points, 03 ICP, 04 Solution, 05 Revenue Model, 06 Market Size, 07 Why Now, 08 Team, 09 Strategy & Moat, 10 Traction). When the interviewee validates or contradicts a claim related to a dimension, set dimensionId (e.g. "02", "03") and validated (true/false).

Return a JSON object with:
- painPoints: array of { quote: string, paraphrase: string, dimensionId?: string, validated?: boolean }
- workarounds: array of strings
- willingnessToPay: array of strings (direct or indirect signals)
- icpMatch: string (does this interviewee match the venture's ICP?)
- featureRequests: array of strings
- objections: array of strings
- keyQuotes: array of strings (suitable for pitch materials)
- signalQuality: "Strong" | "Moderate" | "Weak"`

export async function buildInterviewExtractionBlocks(
  venture: Venture,
  upload: { intervieweeRole: string; intervieweeCompany: string; interviewType: string },
  transcript: string
): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(venture.id, 'ICP, pain points, problem, solution, dimensions, customer profile', {
      topK: 20,
      nodeTypes: ['icp_profile', 'pain_point', 'dimension_insight', 'intake_exchange'],
      maxChars: 6000,
    })
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 6000 })
  }

  const dynamicBlock = `VENTURE CONTEXT:
${context}

INTERVIEW METADATA:
- Role: ${upload.intervieweeRole}
- Company: ${upload.intervieweeCompany}
- Type: ${upload.interviewType}

TRANSCRIPT:
${transcript.slice(0, 12000)}

Extract insights from the transcript above. Return ONLY valid JSON.`

  return [
    { type: 'text', text: EXTRACTION_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}

export async function buildSynthesisBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(venture.id, 'Interview insights, pain points, quotes, objections, validation, cross-interview themes', {
      topK: 30,
      nodeTypes: ['interview_insight', 'interview_synthesis', 'pain_point', 'dimension_insight', 'icp_profile'],
      maxChars: 6000,
    })
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 6000 })
  }

  const interviews = venture.interviews
  const uploads = interviews?.uploads ?? []
  const extractions = interviews?.extractions ?? {}

  const transcriptSummaries = uploads
    .filter((u) => extractions[u.id])
    .map((u) => {
      const ext = extractions[u.id]
      return `[${u.intervieweeCompany} - ${u.intervieweeRole}]
Pain points: ${ext.painPoints?.map((p) => p.paraphrase).join('; ') ?? '—'}
Workarounds: ${ext.workarounds?.join('; ') ?? '—'}
WTP: ${ext.willingnessToPay?.join('; ') ?? '—'}
Objections: ${ext.objections?.join('; ') ?? '—'}
Key quotes: ${ext.keyQuotes?.join('; ') ?? '—'}`
    })
    .join('\n\n')

  const dynamicBlock = `VENTURE CONTEXT:
${context}

EXTRACTED INTERVIEW SUMMARIES:
${transcriptSummaries}

Synthesise patterns across these interviews. Return JSON with:
- themes: array of { theme: string, count: number } (themes mentioned by 2+ interviewees, ranked by count)
- contradictions: array of strings (where interviewees said materially different things)
- topQuotes: array of up to 5 verbatim quotes for pitch materials
- signalQuality: string (assessment of collective evidence strength)`

  return [
    { type: 'text', text: 'You are a synthesis analyst. Identify themes, contradictions, and top quotes across multiple interviews.', cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}
