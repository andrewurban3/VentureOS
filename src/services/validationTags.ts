import type { Venture } from '@/types/venture'

export type ValidationTagType =
  | 'CLIENT_INTERVIEW'
  | 'VC_INTERVIEW'
  | 'EXPERT_INTERVIEW'
  | 'PARTNER_INTERVIEW'
  | 'CONTRADICTED'

export interface ValidationTag {
  type: ValidationTagType
  company: string
  intervieweeRole: string
  quote?: string
  dimensionId?: string
}

const ROLE_TO_TAG_TYPE: Record<string, ValidationTagType> = {
  Prospect: 'CLIENT_INTERVIEW',
  Client: 'CLIENT_INTERVIEW',
  VC: 'VC_INTERVIEW',
  Expert: 'EXPERT_INTERVIEW',
  Partner: 'PARTNER_INTERVIEW',
  Competitor: 'EXPERT_INTERVIEW',
  Other: 'EXPERT_INTERVIEW',
}

/**
 * Scan all interview extractions and map each pain point / quote to
 * the corresponding Idea Intake dimension (via dimensionId) and to
 * competitor claims (via keyword matching).
 *
 * Returns a Record keyed by dimension ID or claim keyword, with an
 * array of ValidationTags for each.
 */
export function buildValidationMap(venture: Venture): Record<string, ValidationTag[]> {
  const map: Record<string, ValidationTag[]> = {}

  const uploads = venture.interviews?.uploads ?? []
  const extractions = venture.interviews?.extractions ?? {}

  for (const upload of uploads) {
    const ext = extractions[upload.id]
    if (!ext) continue

    const tagType = ROLE_TO_TAG_TYPE[upload.intervieweeRole] ?? 'EXPERT_INTERVIEW'

    for (const pp of ext.painPoints ?? []) {
      const tag: ValidationTag = {
        type: pp.validated === false ? 'CONTRADICTED' : tagType,
        company: upload.intervieweeCompany,
        intervieweeRole: upload.intervieweeRole,
        quote: pp.quote,
        dimensionId: pp.dimensionId,
      }

      if (pp.dimensionId) {
        const key = `dim:${pp.dimensionId}`
        map[key] = map[key] ?? []
        map[key].push(tag)
      }

      const keywords = extractKeywords(pp.paraphrase)
      for (const kw of keywords) {
        map[kw] = map[kw] ?? []
        map[kw].push(tag)
      }
    }

    for (const quote of ext.keyQuotes ?? []) {
      const tag: ValidationTag = {
        type: tagType,
        company: upload.intervieweeCompany,
        intervieweeRole: upload.intervieweeRole,
        quote,
      }
      const keywords = extractKeywords(quote)
      for (const kw of keywords) {
        map[kw] = map[kw] ?? []
        map[kw].push(tag)
      }
    }
  }

  return map
}

function extractKeywords(text: string): string[] {
  const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'that', 'this', 'it', 'its',
    'and', 'or', 'but', 'not', 'no', 'if', 'so', 'as', 'than', 'too',
    'very', 'just', 'about', 'also', 'they', 'them', 'their', 'we',
    'our', 'you', 'your', 'he', 'she', 'him', 'her', 'who', 'what',
    'which', 'when', 'where', 'how', 'all', 'each', 'some', 'any',
  ])

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, 5)
}

/**
 * Serialize validation map into a text block suitable for AI context injection.
 */
export function buildValidationStatusSection(venture: Venture): string {
  const map = buildValidationMap(venture)
  const entries = Object.entries(map)
  if (entries.length === 0) return ''

  const lines: string[] = ['VALIDATION STATUS:']

  const dimEntries = entries.filter(([k]) => k.startsWith('dim:'))
  if (dimEntries.length > 0) {
    lines.push('\nDimension Validations:')
    for (const [key, tags] of dimEntries) {
      const dimId = key.replace('dim:', '')
      const validated = tags.filter((t) => t.type !== 'CONTRADICTED')
      const contradicted = tags.filter((t) => t.type === 'CONTRADICTED')
      if (validated.length > 0) {
        lines.push(`  Dimension ${dimId}: Validated by ${validated.map((t) => `${t.intervieweeRole} at ${t.company}`).join(', ')}`)
      }
      if (contradicted.length > 0) {
        lines.push(`  Dimension ${dimId}: CONTRADICTED by ${contradicted.map((t) => `${t.intervieweeRole} at ${t.company}`).join(', ')}`)
      }
    }
  }

  const topicEntries = entries.filter(([k]) => !k.startsWith('dim:')).slice(0, 20)
  if (topicEntries.length > 0) {
    lines.push('\nTopic Validations:')
    for (const [keyword, tags] of topicEntries) {
      const unique = [...new Set(tags.map((t) => `${t.intervieweeRole} at ${t.company}`))]
      const status = tags.some((t) => t.type === 'CONTRADICTED') ? 'MIXED' : 'Validated'
      lines.push(`  "${keyword}": ${status} (${unique.join(', ')})`)
    }
  }

  return lines.join('\n')
}
