/**
 * Shared venture context builder for AI prompts.
 * Used by Scoring, Pressure Test, and Outputs to serialize venture data
 * into a consistent string format.
 */

import type { Venture } from '@/types/venture'
import { buildValidationStatusSection } from '@/services/validationTags'

export interface BuildVentureContextOptions {
  /** Truncate output to this many characters. */
  maxChars?: number
  /** 'intake' = Idea Intake messages only. 'full' = intake + scoring + pressure tests. */
  sections?: 'intake' | 'full'
}

function buildIdeaIntakeSection(venture: Venture): string {
  const messages = venture.ideaIntake?.messages
  if (!messages?.length) {
    return venture.description?.value ?? venture.name.value ?? ''
  }
  return messages
    .map((m) => `${m.role === 'assistant' ? 'Vera' : 'Founder'}: ${m.content}`)
    .join('\n\n')
}

function buildScoringSection(venture: Venture): string {
  const s = venture.scoring
  if (!s) return ''
  return `Corporate: ${s.corporate?.average ?? '—'}, VC: ${s.vc?.average ?? '—'}, Studio: ${s.studio?.average ?? '—'}. Composite: ${s.compositeSignal ?? '—'}.`
}

function buildPressureTestSection(venture: Venture): string {
  const tests = venture.pressureTests
  if (!tests?.length) return ''
  return tests
    .map(
      (p) =>
        `${p.personaName}:\n${p.messages.map((m) => `${m.role}: ${m.content}`).join('\n')}`
    )
    .join('\n\n')
}

function buildIcpSection(venture: Venture): string {
  const icp = venture.icpDocument
  if (!icp) return ''

  const lines: string[] = ['IDEAL CUSTOMER PROFILE:']
  lines.push(`Industry: ${icp.industry}`)

  if (icp.industrySegments?.length) {
    lines.push('Target Segments:')
    icp.industrySegments.forEach((s) => lines.push(`  - ${s.segment}: ${s.rationale}`))
  }

  lines.push(`Company Size: ${icp.companySize}`)
  lines.push(`Primary Buyer: ${icp.buyerRole}`)
  lines.push(`Decision-Making Unit: ${icp.decisionMakingUnit}`)

  if (typeof icp.painPoints === 'string') {
    lines.push(`Pain Points: ${icp.painPoints}`)
  } else if (icp.painPoints?.length) {
    lines.push('Pain Points:')
    icp.painPoints.forEach((p) => lines.push(`  - [${p.severity}] ${p.pain} — Evidence: ${p.evidence}`))
  }

  if (icp.buyingCharacteristics?.length) {
    lines.push('Buying Characteristics (observable signals):')
    icp.buyingCharacteristics.forEach((bc) => lines.push(`  - [${bc.importance}] ${bc.characteristic}`))
  } else if (icp.buyingTrigger) {
    lines.push(`Buying Triggers: ${icp.buyingTrigger}`)
  }

  lines.push(`Current Alternatives: ${icp.currentAlternatives}`)
  lines.push(`Willingness to Pay: ${icp.willingnessToPay}`)

  return lines.join('\n')
}

function buildCompetitorSection(venture: Venture): string {
  const analysis = venture.competitorAnalysis
  if (!analysis?.competitors?.length) return ''

  const confirmed = analysis.competitors.filter(
    (c) => (c.status || 'pending') !== 'rejected'
  )
  if (!confirmed.length) return ''

  const lines: string[] = ['CONFIRMED COMPETITORS:']
  confirmed.forEach((c) => {
    lines.push(`\n${c.name} (${c.category}, Threat: ${c.threatLevel})`)
    if (c.valueProposition) lines.push(`  Value Prop: ${c.valueProposition}`)
    if (c.keyFeatures?.length) lines.push(`  Key Features: ${c.keyFeatures.join(', ')}`)
    lines.push(`  Target ICP: ${c.targetIcp}`)
    lines.push(`  Strengths: ${c.keyStrengths}`)
    lines.push(`  Weaknesses: ${c.keyWeaknesses}`)
    lines.push(`  Our Differentiation: ${c.ourDifferentiation}`)
    if (c.competitorSummary) lines.push(`  Summary: ${c.competitorSummary}`)
  })

  return lines.join('\n')
}

function buildSavedInsightsSection(venture: Venture): string {
  const insights = venture.savedInsights
  if (!insights?.length) return ''

  const lines: string[] = ['SAVED PRESSURE TEST INSIGHTS:']
  insights.forEach((ins) => {
    lines.push(`\n[${ins.personaName}] ${ins.content}`)
    if (ins.founderResponse) lines.push(`  Founder response: ${ins.founderResponse}`)
  })

  return lines.join('\n')
}

function buildFinancialModelsSection(venture: Venture): string {
  const fm = venture.financialModels
  if (!fm) return ''
  const lines: string[] = ['FINANCIAL MODELS:']

  if (fm.mvpCost) {
    lines.push('\nMVP Cost Estimate:')
    if (fm.mvpCost.mvpFeatures?.length) {
      lines.push('  Features:')
      fm.mvpCost.mvpFeatures.forEach((f) => lines.push(`    - ${f.feature}${f.description ? `: ${f.description}` : ''}`))
    }
    lines.push(`  Scenarios: Conservative $${fm.mvpCost.scenarios.conservative.toLocaleString()} / Base $${fm.mvpCost.scenarios.base.toLocaleString()} / Aggressive $${fm.mvpCost.scenarios.aggressive.toLocaleString()}`)
    if (fm.mvpCost.lineItems?.length) {
      lines.push('  Line Items:')
      fm.mvpCost.lineItems.forEach((li) => lines.push(`    - ${li.category}: $${li.base.toLocaleString()}`))
    }
  }

  if (fm.unitEconomics) {
    const ue = fm.unitEconomics.outputs
    lines.push('\nUnit Economics:')
    lines.push(`  LTV: $${ue.ltv.toLocaleString()}, LTV/CAC: ${ue.ltvCac.toFixed(1)}, Payback: ${ue.paybackMonths} months`)
    if (ue.ruleOf40 != null) lines.push(`  Rule of 40: ${ue.ruleOf40.toFixed(0)}`)
  }

  if (fm.marketSizing) {
    const ms = fm.marketSizing
    lines.push('\nMarket Sizing:')
    lines.push(`  TAM: $${ms.tam.toLocaleString()} / SAM: $${ms.sam.toLocaleString()} / SOM: $${ms.som.toLocaleString()}`)
    lines.push(`  Methodology: ${ms.methodology}`)
  }

  return lines.join('\n')
}

function buildInterviewsSection(venture: Venture): string {
  const iv = venture.interviews
  if (!iv?.uploads?.length) return ''
  const lines: string[] = ['INTERVIEW INSIGHTS:']

  for (const upload of iv.uploads) {
    lines.push(`\n[${upload.intervieweeRole}] ${upload.intervieweeCompany} (${upload.interviewDate}, by ${upload.conductedBy})`)
    const ext = iv.extractions?.[upload.id]
    if (ext) {
      if (ext.painPoints?.length) {
        lines.push('  Pain Points:')
        ext.painPoints.forEach((pp) => lines.push(`    - "${pp.quote}" → ${pp.paraphrase}${pp.dimensionId ? ` (dim ${pp.dimensionId})` : ''}${pp.validated ? ' [VALIDATED]' : ''}`))
      }
      if (ext.keyQuotes?.length) {
        lines.push('  Key Quotes:')
        ext.keyQuotes.forEach((q) => lines.push(`    - "${q}"`))
      }
      if (ext.featureRequests?.length) lines.push(`  Feature Requests: ${ext.featureRequests.join(', ')}`)
      if (ext.objections?.length) lines.push(`  Objections: ${ext.objections.join(', ')}`)
      lines.push(`  ICP Match: ${ext.icpMatch}`)
      lines.push(`  Signal Quality: ${ext.signalQuality}`)
    }
  }

  if (iv.synthesis) {
    const syn = iv.synthesis
    lines.push('\nCross-Interview Synthesis:')
    lines.push(`  Themes: ${syn.themes.map((t) => `${t.theme} (${t.count}x)`).join(', ')}`)
    if (syn.contradictions?.length) lines.push(`  Contradictions: ${syn.contradictions.join('; ')}`)
    if (syn.topQuotes?.length) {
      lines.push('  Top Quotes:')
      syn.topQuotes.forEach((q) => lines.push(`    - "${q}"`))
    }
    lines.push(`  Overall Signal: ${syn.signalQuality}`)
  }

  return lines.join('\n')
}

function buildStrategyMoatSection(venture: Venture): string {
  const sm = venture.strategyMoat
  if (!sm?.assessment) return ''
  const a = sm.assessment
  const lines: string[] = ['STRATEGY & MOAT:']

  if (a.recommendedMoats?.length) {
    lines.push('Recommended Moats:')
    a.recommendedMoats.forEach((m) => {
      lines.push(`  - ${m.type}: ${m.rationale}`)
      if (m.examples?.length) lines.push(`    Examples: ${m.examples.join(', ')}`)
    })
  }
  if (a.currentClaims?.length) {
    lines.push('Current Claims:')
    a.currentClaims.forEach((c) => lines.push(`  - ${c.moatType}: ${c.claim} (${c.supported ? 'Supported' : 'Not supported'})`))
  }
  if (a.narrative) lines.push(`\nNarrative: ${a.narrative}`)

  return lines.join('\n')
}

function buildDiscoverSection(venture: Venture): string {
  const research = venture.discover?.research
  if (!research?.length) return ''
  const lines: string[] = ['DISCOVER RESEARCH:']

  research.forEach((r) => {
    lines.push(`\n[${r.type.replace(/_/g, ' ').toUpperCase()}] ${r.query}`)
    lines.push(r.content.slice(0, 2000))
    if (r.citations?.length) {
      lines.push('  Sources:')
      r.citations.forEach((c) => lines.push(`    - ${c.title}${c.url ? ` (${c.url})` : ''}`))
    }
  })

  return lines.join('\n')
}

function buildClientListSection(venture: Venture): string {
  const entries = venture.clientList?.entries
  if (!entries?.length) return ''
  const lines: string[] = ['CLIENT LIST:']

  entries.forEach((e) => {
    lines.push(`  - ${e.companyName}${e.industry ? ` (${e.industry})` : ''} — ${e.rationale} — Status: ${e.status}`)
  })

  return lines.join('\n')
}

function buildSolutionSection(venture: Venture): string {
  const sd = venture.solutionDefinition
  if (!sd) return ''
  const lines: string[] = ['SOLUTION DEFINITION:']
  lines.push(`What It Does: ${sd.whatItDoes}`)
  lines.push(`Differentiation: ${sd.differentiation}`)
  lines.push(`What It Does NOT Do: ${sd.whatItDoesNot}`)
  if (sd.tenXClaim) lines.push(`10x Claim: ${sd.tenXClaim}`)
  if (sd.evidence?.length) {
    lines.push('Evidence:')
    sd.evidence.forEach((e) => lines.push(`  - ${e}`))
  }
  return lines.join('\n')
}

function buildRiskRegisterSection(venture: Venture): string {
  const rr = venture.riskRegister
  if (!rr?.risks?.length) return ''
  const lines: string[] = ['RISK REGISTER:']

  rr.risks.forEach((r) => {
    lines.push(`\n[${r.category.toUpperCase()}] ${r.description}`)
    lines.push(`  Likelihood: ${r.likelihood} | Impact: ${r.impact}`)
    lines.push(`  Mitigation: ${r.mitigation}`)
    lines.push(`  Residual Risk: ${r.residualRisk}`)
  })

  return lines.join('\n')
}

function buildCitationsSection(venture: Venture): string {
  const cites = venture.citations
  if (!cites?.length) return ''
  const lines = cites.map((c, i) => {
    const url = c.url ? ` - ${c.url}` : ''
    return `[${i + 1}] "${c.title}"${url} (via ${c.context})`
  })
  return `SOURCES:\n${lines.join('\n')}`
}

/**
 * Build a serialized venture context string for AI prompts.
 * @param venture The venture to serialize
 * @param options maxChars truncates the result; sections controls what to include
 */
export function buildVentureContext(
  venture: Venture,
  options?: BuildVentureContextOptions
): string {
  const sections = options?.sections ?? 'full'
  const maxChars = options?.maxChars

  let out: string
  if (sections === 'intake') {
    out = buildIdeaIntakeSection(venture)
  } else {
    const intake = buildIdeaIntakeSection(venture)
    const scoring = buildScoringSection(venture)
    const pressure = buildPressureTestSection(venture)
    const icp = buildIcpSection(venture)
    const competitors = buildCompetitorSection(venture)
    const savedInsights = buildSavedInsightsSection(venture)
    const financialModels = buildFinancialModelsSection(venture)
    const interviews = buildInterviewsSection(venture)
    const strategyMoat = buildStrategyMoatSection(venture)
    const discover = buildDiscoverSection(venture)
    const clientList = buildClientListSection(venture)
    const solution = buildSolutionSection(venture)
    const riskRegister = buildRiskRegisterSection(venture)
    const validationStatus = buildValidationStatusSection(venture)
    const citations = buildCitationsSection(venture)
    out = [
      intake, icp, competitors, savedInsights, scoring, pressure,
      financialModels, interviews, strategyMoat, discover, clientList,
      solution, riskRegister, validationStatus, citations,
    ].filter(Boolean).join('\n\n---\n\n')
  }

  if (maxChars != null && out.length > maxChars) {
    return out.slice(0, maxChars)
  }
  return out
}
