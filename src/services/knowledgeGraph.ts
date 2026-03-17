import { supabase } from '@/lib/supabase'
import { embedBatch, embedQuery } from '@/services/embeddings'
import type { Venture } from '@/types/venture'

// ── Types ────────────────────────────────────────────────────

interface KnowledgeNode {
  venture_id: string
  node_type: string
  source_table: string
  source_id: string
  title: string
  content: string
  metadata: Record<string, unknown>
}

interface EdgeSpec {
  sourceKey: string
  targetKey: string
  edge_type: string
  weight: number
}

interface MatchedNode {
  id: string
  node_type: string
  source_table: string
  source_id: string
  title: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
}

interface ConnectedNode {
  id: string
  node_type: string
  title: string
  content: string
  metadata: Record<string, unknown>
  edge_type: string
  edge_weight: number
}

export interface RetrieveOptions {
  topK?: number
  nodeTypes?: string[]
  includeEdges?: boolean
  maxChars?: number
}

/** Node types for Stage 05–07; pass to retrieveVentureContext when agents need MVP Readiness / Build / Commercial context. */
export const KG_NODE_TYPES_STAGE_05_07 = [
  'technical_architecture',
  'product_roadmap',
  'feature_prd',
  'sprint_plan',
  'client_feedback_summary',
  'updated_roadmap',
  'pricing_lab_assumption',
  'pricing_lab',
  'pricing_implementation_tracker',
  'gtm_tracker',
] as const

// ── Node extraction ──────────────────────────────────────────
// Given a Partial<Venture> update, extract text nodes to embed.

function extractNodes(ventureId: string, updates: Partial<Venture>): KnowledgeNode[] {
  const nodes: KnowledgeNode[] = []

  if (updates.name || updates.description || updates.stage) {
    nodes.push({
      venture_id: ventureId,
      node_type: 'venture_summary',
      source_table: 'ventures',
      source_id: ventureId,
      title: 'Venture Summary',
      content: [
        updates.name ? `Name: ${updates.name.value}` : '',
        updates.stage ? `Stage: ${updates.stage.value}` : '',
        updates.description ? `Description: ${updates.description.value}` : '',
      ].filter(Boolean).join('\n'),
      metadata: {},
    })
  }

  if (updates.ideaIntake) {
    const messages = updates.ideaIntake.messages ?? []
    for (let i = 0; i < messages.length; i += 2) {
      const user = messages[i]
      const assistant = messages[i + 1]
      if (!user) continue
      const pairIdx = Math.floor(i / 2)
      nodes.push({
        venture_id: ventureId,
        node_type: 'intake_exchange',
        source_table: 'idea_intakes',
        source_id: `${ventureId}:msg:${pairIdx}`,
        title: `Intake Exchange ${pairIdx + 1}`,
        content: `Founder: ${user.content}${assistant ? `\nVera: ${assistant.content}` : ''}`,
        metadata: { pairIndex: pairIdx },
      })
    }

    for (const dim of updates.ideaIntake.dimensionCoverage ?? []) {
      if (dim.status === 'not_started') continue
      nodes.push({
        venture_id: ventureId,
        node_type: 'dimension_insight',
        source_table: 'idea_intakes',
        source_id: `${ventureId}:dim:${dim.id}`,
        title: `Dimension ${dim.id}`,
        content: `Dimension ${dim.id} — Status: ${dim.status} — ${dim.summary}${dim.flags?.length ? ` — Flags: ${dim.flags.join(', ')}` : ''}`,
        metadata: { dimensionId: dim.id, status: dim.status },
      })
    }
  }

  if (updates.scoring) {
    const s = updates.scoring
    for (const lens of ['corporate', 'vc', 'studio'] as const) {
      const result = s[lens]
      if (!result) continue
      const dimText = result.dimensions?.map((d) => `${d.name}: ${d.score}/5 — ${d.explanation}`).join('\n') ?? ''
      nodes.push({
        venture_id: ventureId,
        node_type: 'scoring_result',
        source_table: 'scoring_results',
        source_id: `${ventureId}:${lens}`,
        title: `${lens.charAt(0).toUpperCase() + lens.slice(1)} Scoring`,
        content: `${lens.charAt(0).toUpperCase() + lens.slice(1)} Lens — Average: ${result.average}/5\n${dimText}${result.recommendation ? `\nRecommendation: ${result.recommendation}` : ''}`,
        metadata: { lens, average: result.average },
      })
    }
  }

  if (updates.icpDocument) {
    const icp = updates.icpDocument
    const fullText = [
      `Industry: ${icp.industry}`,
      `Company Size: ${icp.companySize}`,
      `Buyer Role: ${icp.buyerRole}`,
      `Decision-Making Unit: ${icp.decisionMakingUnit}`,
      icp.buyingTrigger ? `Buying Trigger: ${icp.buyingTrigger}` : '',
      `Current Alternatives: ${icp.currentAlternatives}`,
      `Willingness to Pay: ${icp.willingnessToPay}`,
    ].filter(Boolean).join('\n')

    nodes.push({
      venture_id: ventureId,
      node_type: 'icp_profile',
      source_table: 'icp_documents',
      source_id: `${ventureId}:icp`,
      title: 'Ideal Customer Profile',
      content: fullText,
      metadata: { industry: icp.industry },
    })

    const painPoints = typeof icp.painPoints === 'string'
      ? [{ pain: icp.painPoints, severity: 'Medium' as const, evidence: '' }]
      : icp.painPoints ?? []
    for (let i = 0; i < painPoints.length; i++) {
      const p = painPoints[i]
      nodes.push({
        venture_id: ventureId,
        node_type: 'pain_point',
        source_table: 'icp_documents',
        source_id: `${ventureId}:pain:${i}`,
        title: `Pain Point: ${p.pain.slice(0, 60)}`,
        content: `[${p.severity}] ${p.pain}${p.evidence ? ` — Evidence: ${p.evidence}` : ''}`,
        metadata: { severity: p.severity, index: i },
      })
    }
  }

  if (updates.competitorAnalysis) {
    for (const c of updates.competitorAnalysis.competitors ?? []) {
      nodes.push({
        venture_id: ventureId,
        node_type: 'competitor_profile',
        source_table: 'competitors',
        source_id: c.id,
        title: `Competitor: ${c.name}`,
        content: [
          `${c.name} (${c.category}, Threat: ${c.threatLevel})`,
          c.valueProposition ? `Value Prop: ${c.valueProposition}` : '',
          `Strengths: ${c.keyStrengths}`,
          `Weaknesses: ${c.keyWeaknesses}`,
          `Our Differentiation: ${c.ourDifferentiation}`,
          c.competitorSummary ? `Summary: ${c.competitorSummary}` : '',
        ].filter(Boolean).join('\n'),
        metadata: { category: c.category, threatLevel: c.threatLevel, status: c.status, source: c.source },
      })
    }
  }

  if (updates.pressureTests) {
    for (const pt of updates.pressureTests) {
      const summary = pt.messages.slice(-4).map((m) => `${m.role}: ${m.content.slice(0, 200)}`).join('\n')
      nodes.push({
        venture_id: ventureId,
        node_type: 'pressure_test_exchange',
        source_table: 'pressure_test_sessions',
        source_id: `${ventureId}:pt:${pt.personaId}`,
        title: `Pressure Test: ${pt.personaName}`,
        content: `${pt.personaName} pressure test:\n${summary}`,
        metadata: { personaId: pt.personaId },
      })
    }
  }

  if (updates.savedInsights) {
    for (const ins of updates.savedInsights) {
      nodes.push({
        venture_id: ventureId,
        node_type: 'saved_insight',
        source_table: 'saved_insights',
        source_id: ins.id,
        title: `Insight: ${ins.personaName}`,
        content: `[${ins.personaName}] ${ins.content}${ins.founderResponse ? `\nFounder response: ${ins.founderResponse}` : ''}`,
        metadata: { personaId: ins.personaId },
      })
    }
  }

  if (updates.clientList) {
    for (const e of updates.clientList.entries ?? []) {
      nodes.push({
        venture_id: ventureId,
        node_type: 'client_entry',
        source_table: 'client_list_entries',
        source_id: e.id,
        title: `Client: ${e.companyName}`,
        content: `${e.companyName}${e.industry ? ` (${e.industry})` : ''} — ${e.rationale} — Status: ${e.status}`,
        metadata: { status: e.status, source: e.source },
      })
    }
  }

  if (updates.financialModels) {
    const fm = updates.financialModels
    if (fm.mvpCost) {
      for (const f of fm.mvpCost.mvpFeatures ?? []) {
        nodes.push({
          venture_id: ventureId,
          node_type: 'mvp_feature',
          source_table: 'financial_models',
          source_id: `${ventureId}:mvpf:${f.feature.slice(0, 30)}`,
          title: `MVP Feature: ${f.feature}`,
          content: `${f.feature}${f.description ? ` — ${f.description}` : ''}`,
          metadata: {},
        })
      }
      for (const a of fm.mvpCost.assumptions ?? []) {
        nodes.push({
          venture_id: ventureId,
          node_type: 'financial_assumption',
          source_table: 'financial_models',
          source_id: `${ventureId}:fa:${a.id}`,
          title: `Assumption: ${a.label}`,
          content: `${a.label}: ${a.value} (${a.source}, ${a.confidence} confidence)${a.citation ? ` — Source: ${a.citation.title}` : ''}`,
          metadata: { source: a.source, confidence: a.confidence },
        })
      }
    }
    if (fm.unitEconomics) {
      for (const a of fm.unitEconomics.assumptions ?? []) {
        nodes.push({
          venture_id: ventureId,
          node_type: 'financial_assumption',
          source_table: 'financial_models',
          source_id: `${ventureId}:fa:${a.id}`,
          title: `Assumption: ${a.label}`,
          content: `${a.label}: ${a.value} (${a.source}, ${a.confidence} confidence)`,
          metadata: { source: a.source, confidence: a.confidence },
        })
      }
    }
    if (fm.marketSizing) {
      nodes.push({
        venture_id: ventureId,
        node_type: 'market_sizing',
        source_table: 'financial_models',
        source_id: `${ventureId}:market`,
        title: 'Market Sizing',
        content: `TAM: $${fm.marketSizing.tam.toLocaleString()} / SAM: $${fm.marketSizing.sam.toLocaleString()} / SOM: $${fm.marketSizing.som.toLocaleString()}${fm.marketSizing.cagr != null ? ` / CAGR: ${fm.marketSizing.cagr}%` : ''}\n${fm.marketSizing.methodology}`,
        metadata: { tam: fm.marketSizing.tam, sam: fm.marketSizing.sam, som: fm.marketSizing.som, cagr: fm.marketSizing.cagr },
      })
      for (const a of fm.marketSizing.assumptions ?? []) {
        nodes.push({
          venture_id: ventureId,
          node_type: 'financial_assumption',
          source_table: 'financial_models',
          source_id: `${ventureId}:fa:${a.id}`,
          title: `Assumption: ${a.label}`,
          content: `${a.label}: ${a.value} (${a.source}, ${a.confidence} confidence)`,
          metadata: { source: a.source, confidence: a.confidence },
        })
      }
    }
  }

  if (updates.interviews) {
    const extractions = updates.interviews.extractions ?? {}
    for (const [uploadId, ext] of Object.entries(extractions)) {
      for (let i = 0; i < (ext.painPoints ?? []).length; i++) {
        const pp = ext.painPoints[i]
        nodes.push({
          venture_id: ventureId,
          node_type: 'interview_insight',
          source_table: 'interview_extractions',
          source_id: `${uploadId}:pp:${i}`,
          title: `Interview Pain Point`,
          content: `"${pp.quote}" — ${pp.paraphrase}${pp.dimensionId ? ` (Dimension ${pp.dimensionId})` : ''}`,
          metadata: { uploadId, type: 'pain_point', validated: pp.validated },
        })
      }
      for (let i = 0; i < (ext.keyQuotes ?? []).length; i++) {
        nodes.push({
          venture_id: ventureId,
          node_type: 'interview_insight',
          source_table: 'interview_extractions',
          source_id: `${uploadId}:kq:${i}`,
          title: 'Key Quote',
          content: ext.keyQuotes[i],
          metadata: { uploadId, type: 'key_quote' },
        })
      }
    }

    if (updates.interviews.synthesis) {
      const syn = updates.interviews.synthesis
      nodes.push({
        venture_id: ventureId,
        node_type: 'interview_synthesis',
        source_table: 'cross_interview_syntheses',
        source_id: `${ventureId}:synthesis`,
        title: 'Cross-Interview Synthesis',
        content: [
          `Themes: ${syn.themes.map((t) => `${t.theme} (${t.count}x)`).join(', ')}`,
          syn.contradictions.length ? `Contradictions: ${syn.contradictions.join('; ')}` : '',
          `Signal Quality: ${syn.signalQuality}`,
        ].filter(Boolean).join('\n'),
        metadata: { signalQuality: syn.signalQuality },
      })
    }
  }

  if (updates.strategyMoat?.assessment) {
    const a = updates.strategyMoat.assessment
    for (const moat of a.recommendedMoats ?? []) {
      nodes.push({
        venture_id: ventureId,
        node_type: 'moat_recommendation',
        source_table: 'moat_assessments',
        source_id: `${ventureId}:moat:${moat.type.slice(0, 30)}`,
        title: `Moat: ${moat.type}`,
        content: `${moat.type} — ${moat.rationale}${moat.examples?.length ? ` — Examples: ${moat.examples.join(', ')}` : ''}`,
        metadata: { moatType: moat.type },
      })
    }
  }

  if (updates.businessBrief) {
    const c = updates.businessBrief.content
    for (const [key, text] of Object.entries(c)) {
      if (!text) continue
      nodes.push({
        venture_id: ventureId,
        node_type: 'brief_section',
        source_table: 'business_briefs',
        source_id: `${ventureId}:brief:${key}`,
        title: `Brief: ${key}`,
        content: text,
        metadata: { section: key },
      })
    }
  }

  if (updates.investmentMemo) {
    for (const [key, text] of Object.entries(updates.investmentMemo.content)) {
      if (!text) continue
      nodes.push({
        venture_id: ventureId,
        node_type: 'memo_section',
        source_table: 'investment_memos',
        source_id: `${ventureId}:memo:${key}`,
        title: `Memo: ${key}`,
        content: text,
        metadata: { section: key },
      })
    }
  }

  if (updates.solutionDefinition) {
    const sd = updates.solutionDefinition
    nodes.push({
      venture_id: ventureId,
      node_type: 'solution_definition',
      source_table: 'solution_definitions',
      source_id: `${ventureId}:solution`,
      title: 'Solution Definition',
      content: [
        `What It Does: ${sd.whatItDoes}`,
        `Differentiation: ${sd.differentiation}`,
        `What It Does Not Do: ${sd.whatItDoesNot}`,
        sd.tenXClaim ? `10x Claim: ${sd.tenXClaim}` : '',
        sd.evidence?.length ? `Evidence:\n${sd.evidence.map(e => `  • ${e}`).join('\n')}` : '',
      ].filter(Boolean).join('\n'),
      metadata: {},
    })
  }

  if (updates.riskRegister) {
    for (const risk of updates.riskRegister.risks) {
      nodes.push({
        venture_id: ventureId,
        node_type: 'risk_item',
        source_table: 'risk_registers',
        source_id: `${ventureId}:risk:${risk.id}`,
        title: `Risk: ${risk.description.slice(0, 60)}`,
        content: `[${risk.category}] ${risk.description}\nLikelihood: ${risk.likelihood}, Impact: ${risk.impact}\nMitigation: ${risk.mitigation}\nResidual: ${risk.residualRisk}`,
        metadata: { category: risk.category, likelihood: risk.likelihood, impact: risk.impact, source: risk.source },
      })
    }
  }

  if (updates.citations) {
    for (const c of updates.citations) {
      nodes.push({
        venture_id: ventureId,
        node_type: 'citation',
        source_table: 'venture_citations',
        source_id: c.id,
        title: c.title,
        content: `${c.title}${c.url ? ` — ${c.url}` : ''} (${c.context})${c.excerpt ? `\n${c.excerpt}` : ''}`,
        metadata: { source: c.source, context: c.context },
      })
    }
  }

  if (updates.designPartnerPipeline) {
    const candidates = updates.designPartnerPipeline.candidates ?? []
    for (const c of candidates) {
      const qualText = c.qualification
        ? `\nQualification: ${c.qualification.total}/100 — ${c.qualification.verdict}\n${c.qualification.recommendation}`
        : ''
      nodes.push({
        venture_id: ventureId,
        node_type: 'design_partner_candidate',
        source_table: 'design_partner_pipelines',
        source_id: `${ventureId}:dp:${c.id}`,
        title: `Design Partner: ${c.companyName}`,
        content: `${c.companyName} — ${c.contactName} (${c.contactTitle})\nStage: ${c.pipelineStage}${c.whyFit ? `\nWhy Fit: ${c.whyFit}` : ''}${qualText}${c.conversationNotes ? `\nNotes: ${c.conversationNotes}` : ''}`,
        metadata: { source: c.source, pipelineStage: c.pipelineStage, candidateId: c.id },
      })
    }
    const signedCount = candidates.filter((c) => c.pipelineStage === 'signed').length
    nodes.push({
      venture_id: ventureId,
      node_type: 'design_partner_pipeline_summary',
      source_table: 'design_partner_pipelines',
      source_id: `${ventureId}:dp:summary`,
      title: 'Design Partner Pipeline',
      content: `Design partner pipeline: ${candidates.length} candidates, ${signedCount} signed (${signedCount}/3 required).\nStages: ${['identified', 'outreach_sent', 'response_received', 'conversation', 'loi', 'signed'].map((s) => `${s}: ${candidates.filter((c) => c.pipelineStage === s).length}`).join(', ')}`,
      metadata: { totalCandidates: candidates.length, signedCount },
    })
  }

  if (updates.designPartnerFeedbackSummary) {
    const fb = updates.designPartnerFeedbackSummary
    const content = [
      `Common Themes: ${fb.content.commonThemes.join('; ')}`,
      `Divergent Feedback: ${fb.content.divergentFeedback.join('; ')}`,
      `Strongest Use Cases: ${fb.content.strongestUseCases.join('; ')}`,
      `Product Gaps: ${fb.content.productGaps.join('; ')}`,
      fb.content.narrative ? `Narrative: ${fb.content.narrative}` : '',
    ].filter(Boolean).join('\n')
    nodes.push({
      venture_id: ventureId,
      node_type: 'design_partner_feedback',
      source_table: 'design_partner_feedback_summaries',
      source_id: `${ventureId}:dpfeedback`,
      title: 'Design Partner Feedback Summary',
      content,
      metadata: {
        source: 'DESIGN_PARTNER',
        partnerCompanies: fb.partnerTags.map((t) => t.companyName),
        generatedAt: fb.generatedAt,
      },
    })
  }

  if (updates.mvpFeatureList) {
    for (const f of updates.mvpFeatureList.features ?? []) {
      nodes.push({
        venture_id: ventureId,
        node_type: 'mvp_feature_s04',
        source_table: 'mvp_feature_lists',
        source_id: `${ventureId}:mvpf4:${f.id}`,
        title: `MVP Feature: ${f.name}`,
        content: `${f.name} — ${f.description}\nMoSCoW: ${f.moscow}, Complexity: ${f.complexity}${f.requestedByPartnerIds?.length ? `\nRequested by partners: ${f.requestedByPartnerIds.join(', ')}` : ''}`,
        metadata: { source: f.source, moscow: f.moscow, complexity: f.complexity },
      })
    }
  }

  // Stage 05
  if (updates.technicalArchitecture) {
    const t = updates.technicalArchitecture
    const c = t.content
    const content = [
      `Tech stack: ${c.techStack}`,
      `Component diagram: ${c.componentDiagram}`,
      `Integration points: ${c.integrationPoints}`,
      `Key decisions: ${c.keyDecisions}`,
      `Risks and open questions: ${c.risksAndOpenQuestions}`,
    ].join('\n')
    nodes.push({
      venture_id: ventureId,
      node_type: 'technical_architecture',
      source_table: 'technical_architectures',
      source_id: `${ventureId}:techarch`,
      title: 'Technical Architecture',
      content,
      metadata: { source: t.source, generatedAt: t.generatedAt },
    })
  }

  if (updates.productRoadmap) {
    const r = updates.productRoadmap
    const content = r.phases.map((p) =>
      `${p.phase}: milestones ${p.milestones.join('; ')}; features ${p.featuresInScope.join(', ')}; success ${p.successCriteria.join('; ')}${p.capitalRequirement ? `; capital ${p.capitalRequirement}` : ''}`
    ).join('\n')
    nodes.push({
      venture_id: ventureId,
      node_type: 'product_roadmap',
      source_table: 'product_roadmaps',
      source_id: `${ventureId}:roadmap`,
      title: 'Product Roadmap',
      content,
      metadata: { source: r.source, generatedAt: r.generatedAt },
    })
  }

  if (updates.featurePrdList) {
    for (const prd of updates.featurePrdList.prds ?? []) {
      const content = [
        prd.name,
        `User story: ${prd.userStory}`,
        `Acceptance criteria: ${prd.acceptanceCriteria.join('; ')}`,
        `In scope: ${prd.inScope.join('; ')}`,
        `Out of scope: ${prd.outOfScope.join('; ')}`,
        prd.dependencies.length ? `Dependencies: ${prd.dependencies.join(', ')}` : '',
        prd.designPartnerOrigin ? `Design partner origin: ${prd.designPartnerOrigin}` : '',
      ].filter(Boolean).join('\n')
      nodes.push({
        venture_id: ventureId,
        node_type: 'feature_prd',
        source_table: 'feature_prd_lists',
        source_id: `${ventureId}:prd:${prd.id}`,
        title: `Feature PRD: ${prd.name}`,
        content,
        metadata: { source: prd.source, featureId: prd.featureId, generatedAt: prd.generatedAt },
      })
    }
  }

  if (updates.sprintPlan) {
    const s = updates.sprintPlan
    const content = [
      ...s.sprints.map((sp) =>
        `Sprint ${sp.sprintNumber} (${sp.durationWeeks}w): ${sp.featuresInScope.join(', ')}; DoD: ${sp.definitionOfDone}; AC: ${sp.acceptanceCriteria.join('; ')}`
      ),
      ...s.assumptions.map((a) => `Assumption: ${a.label} = ${a.value} (${a.source})`),
    ].join('\n')
    nodes.push({
      venture_id: ventureId,
      node_type: 'sprint_plan',
      source_table: 'sprint_plans',
      source_id: `${ventureId}:sprints`,
      title: 'Sprint Plan',
      content,
      metadata: { source: s.source, generatedAt: s.generatedAt },
    })
  }

  // Stage 06
  if (updates.clientFeedbackSummary) {
    const c = updates.clientFeedbackSummary
    const cnt = c.content
    const content = [
      `Themes: ${cnt.themes.join('; ')}`,
      `Divergence: ${cnt.divergence.join('; ')}`,
      `Top signals: ${cnt.topSignals.join('; ')}`,
      `Product gaps: ${cnt.productGaps.join('; ')}`,
      cnt.narrative ? `Narrative: ${cnt.narrative}` : '',
      c.clientTags.length ? `Clients: ${c.clientTags.map((t) => t.companyName).join(', ')}` : '',
    ].filter(Boolean).join('\n')
    nodes.push({
      venture_id: ventureId,
      node_type: 'client_feedback_summary',
      source_table: 'client_feedback_summaries',
      source_id: `${ventureId}:clientfb`,
      title: 'Client Feedback Summary',
      content,
      metadata: {
        source: c.source,
        clientCompanies: c.clientTags.map((t) => t.companyName),
        generatedAt: c.generatedAt,
      },
    })
  }

  if (updates.updatedRoadmap) {
    const u = updates.updatedRoadmap
    const content = u.phases.map((p) =>
      `${p.phase}: ${p.milestones.join('; ')}; ${p.featuresInScope.join(', ')}; ${p.successCriteria.join('; ')}`
    ).join('\n')
    nodes.push({
      venture_id: ventureId,
      node_type: 'updated_roadmap',
      source_table: 'updated_roadmaps',
      source_id: `${ventureId}:updatedroadmap`,
      title: 'Updated Roadmap',
      content,
      metadata: { source: u.source, generatedAt: u.generatedAt },
    })
  }

  if (updates.pricingLab) {
    const pl = updates.pricingLab
    for (const a of pl.assumptions ?? []) {
      nodes.push({
        venture_id: ventureId,
        node_type: 'pricing_lab_assumption',
        source_table: 'pricing_labs',
        source_id: `${ventureId}:pla:${a.id}`,
        title: `Pricing assumption: ${a.label}`,
        content: `${a.label}: ${a.value} (${a.source}, ${a.confidence})${a.citation ? ` — ${a.citation.title}` : ''}`,
        metadata: { source: a.source, confidence: a.confidence, citation: a.citation },
      })
    }
    if (pl.recommendation) {
      const rec = pl.recommendation
      nodes.push({
        venture_id: ventureId,
        node_type: 'pricing_lab',
        source_table: 'pricing_labs',
        source_id: `${ventureId}:pricinglab`,
        title: 'Pricing Lab Recommendation',
        content: `Tiers: ${rec.tierStructure}; Price points: ${rec.pricePoints}; Discounting: ${rec.discountingPolicy}; Rationale: ${rec.rationale}`,
        metadata: { source: rec.source, generatedAt: rec.generatedAt },
      })
    }
  }

  // Stage 07
  if (updates.pricingImplementationTracker) {
    const pi = updates.pricingImplementationTracker
    const content = [
      `Rollout: ${pi.rolloutStatus}`,
      ...pi.milestones.map((m) => `• ${m}`),
      pi.pricingLabSnapshot
        ? `Snapshot: ${pi.pricingLabSnapshot.tierStructure}; ${pi.pricingLabSnapshot.pricePoints}`
        : '',
    ].filter(Boolean).join('\n')
    nodes.push({
      venture_id: ventureId,
      node_type: 'pricing_implementation_tracker',
      source_table: 'pricing_implementation_trackers',
      source_id: `${ventureId}:pricingimpl`,
      title: 'Pricing Implementation Tracker',
      content,
      metadata: { source: pi.source, generatedAt: pi.generatedAt },
    })
  }

  if (updates.gtmTracker) {
    const g = updates.gtmTracker
    const sow = g.signedSowTracker.map((e) => `${e.company}: ${e.status}`).join('\n')
    const content = [
      `GTM plan: ${g.gtmPlan}`,
      `Pricing implementation plan: ${g.pricingImplementationPlan}`,
      sow ? `Signed SOWs:\n${sow}` : '',
    ].filter(Boolean).join('\n')
    nodes.push({
      venture_id: ventureId,
      node_type: 'gtm_tracker',
      source_table: 'gtm_trackers',
      source_id: `${ventureId}:gtm`,
      title: 'GTM Tracker',
      content,
      metadata: { source: g.source, generatedAt: g.generatedAt },
    })
  }

  return nodes
}

// ── Edge inference ───────────────────────────────────────────
// Create edges between related nodes in the same venture.

function inferEdges(nodes: KnowledgeNode[]): EdgeSpec[] {
  const edges: EdgeSpec[] = []
  const byType = new Map<string, KnowledgeNode[]>()
  for (const n of nodes) {
    const list = byType.get(n.node_type) ?? []
    list.push(n)
    byType.set(n.node_type, list)
  }

  const painPoints = byType.get('pain_point') ?? []
  const icpProfiles = byType.get('icp_profile') ?? []
  const competitors = byType.get('competitor_profile') ?? []
  const insights = byType.get('saved_insight') ?? []
  const interviewInsights = byType.get('interview_insight') ?? []
  const moats = byType.get('moat_recommendation') ?? []
  const mvpFeatures = byType.get('mvp_feature') ?? []
  const briefSections = byType.get('brief_section') ?? []
  const dimensions = byType.get('dimension_insight') ?? []
  const solutionDefs = byType.get('solution_definition') ?? []
  const riskItems = byType.get('risk_item') ?? []
  const dpCandidates = byType.get('design_partner_candidate') ?? []
  const dpFeedback = byType.get('design_partner_feedback') ?? []
  const mvpFeaturesS04 = byType.get('mvp_feature_s04') ?? []
  const techArch = byType.get('technical_architecture') ?? []
  const featurePrds = byType.get('feature_prd') ?? []
  const productRoadmaps = byType.get('product_roadmap') ?? []
  const clientFeedback = byType.get('client_feedback_summary') ?? []
  const updatedRoadmaps = byType.get('updated_roadmap') ?? []
  const pricingLabNodes = byType.get('pricing_lab') ?? []
  const pricingLabAssumptions = byType.get('pricing_lab_assumption') ?? []
  const financialAssumptions = byType.get('financial_assumption') ?? []
  const pricingImpl = byType.get('pricing_implementation_tracker') ?? []
  const gtmTrackers = byType.get('gtm_tracker') ?? []

  for (const pp of painPoints) {
    for (const icp of icpProfiles) {
      edges.push({ sourceKey: key(icp), targetKey: key(pp), edge_type: 'ADDRESSES_PAIN', weight: 0.9 })
    }
    for (const feat of mvpFeatures) {
      edges.push({ sourceKey: key(feat), targetKey: key(pp), edge_type: 'ADDRESSES_PAIN', weight: 0.7 })
    }
  }

  for (const c of competitors) {
    for (const icp of icpProfiles) {
      edges.push({ sourceKey: key(c), targetKey: key(icp), edge_type: 'TARGETS_ICP', weight: 0.8 })
    }
  }

  for (const ins of insights) {
    for (const dim of dimensions) {
      edges.push({ sourceKey: key(ins), targetKey: key(dim), edge_type: 'VALIDATES', weight: 0.7 })
    }
  }

  for (const ii of interviewInsights) {
    const validated = ii.metadata.validated
    for (const dim of dimensions) {
      edges.push({
        sourceKey: key(ii),
        targetKey: key(dim),
        edge_type: validated === false ? 'CONTRADICTS' : 'VALIDATES',
        weight: 0.8,
      })
    }
  }

  for (const moat of moats) {
    for (const section of briefSections) {
      edges.push({ sourceKey: key(moat), targetKey: key(section), edge_type: 'SUPPORTS_MOAT', weight: 0.6 })
    }
  }

  for (const sol of solutionDefs) {
    for (const c of competitors) {
      edges.push({ sourceKey: key(sol), targetKey: key(c), edge_type: 'DIFFERENTIATES_FROM', weight: 0.8 })
    }
    for (const moat of moats) {
      edges.push({ sourceKey: key(sol), targetKey: key(moat), edge_type: 'BUILDS_MOAT', weight: 0.7 })
    }
    for (const pp of painPoints) {
      edges.push({ sourceKey: key(sol), targetKey: key(pp), edge_type: 'ADDRESSES_PAIN', weight: 0.8 })
    }
  }

  for (const risk of riskItems) {
    for (const dim of dimensions) {
      edges.push({ sourceKey: key(risk), targetKey: key(dim), edge_type: 'RISKS', weight: 0.6 })
    }
    for (const ins of insights) {
      edges.push({ sourceKey: key(risk), targetKey: key(ins), edge_type: 'INFORMED_BY', weight: 0.5 })
    }
  }

  for (const dp of dpCandidates) {
    for (const icp of icpProfiles) {
      edges.push({ sourceKey: key(dp), targetKey: key(icp), edge_type: 'MATCHES_ICP', weight: 0.8 })
    }
    for (const sol of solutionDefs) {
      edges.push({ sourceKey: key(dp), targetKey: key(sol), edge_type: 'VALIDATES_SOLUTION', weight: 0.7 })
    }
  }

  for (const fb of dpFeedback) {
    for (const dp of dpCandidates) {
      edges.push({ sourceKey: key(fb), targetKey: key(dp), edge_type: 'SYNTHESIZES', weight: 0.9 })
    }
    for (const sol of solutionDefs) {
      edges.push({ sourceKey: key(fb), targetKey: key(sol), edge_type: 'INFORMS', weight: 0.8 })
    }
  }

  for (const feat of mvpFeaturesS04) {
    for (const sol of solutionDefs) {
      edges.push({ sourceKey: key(feat), targetKey: key(sol), edge_type: 'IMPLEMENTS', weight: 0.8 })
    }
    for (const fb of dpFeedback) {
      edges.push({ sourceKey: key(feat), targetKey: key(fb), edge_type: 'DERIVED_FROM', weight: 0.9 })
    }
    for (const pp of painPoints) {
      edges.push({ sourceKey: key(feat), targetKey: key(pp), edge_type: 'ADDRESSES_PAIN', weight: 0.7 })
    }
  }

  for (const ta of techArch) {
    for (const sol of solutionDefs) {
      edges.push({ sourceKey: key(ta), targetKey: key(sol), edge_type: 'IMPLEMENTS', weight: 0.8 })
    }
  }

  for (const prd of featurePrds) {
    const prdFeatureId = prd.metadata.featureId as string | undefined
    if (!prdFeatureId) continue
    for (const feat of mvpFeaturesS04) {
      const featId = feat.source_id.includes(':mvpf4:') ? feat.source_id.split(':mvpf4:')[1] : undefined
      if (featId === prdFeatureId) {
        edges.push({ sourceKey: key(prd), targetKey: key(feat), edge_type: 'SPECIFIES', weight: 0.9 })
        break
      }
    }
  }

  for (const cf of clientFeedback) {
    for (const fb of dpFeedback) {
      edges.push({ sourceKey: key(cf), targetKey: key(fb), edge_type: 'EXTENDS', weight: 0.8 })
    }
  }

  for (const ur of updatedRoadmaps) {
    for (const pr of productRoadmaps) {
      edges.push({ sourceKey: key(ur), targetKey: key(pr), edge_type: 'UPDATES', weight: 0.9 })
    }
  }

  for (const pla of pricingLabAssumptions) {
    for (const fa of financialAssumptions) {
      edges.push({ sourceKey: key(pla), targetKey: key(fa), edge_type: 'RELATES_TO', weight: 0.6 })
    }
  }
  for (const pl of pricingLabNodes) {
    for (const fa of financialAssumptions) {
      edges.push({ sourceKey: key(pl), targetKey: key(fa), edge_type: 'INFORMS', weight: 0.7 })
    }
  }

  for (const pi of pricingImpl) {
    for (const pl of pricingLabNodes) {
      edges.push({ sourceKey: key(pi), targetKey: key(pl), edge_type: 'TRACKS', weight: 0.9 })
    }
  }

  for (const gtm of gtmTrackers) {
    for (const pi of pricingImpl) {
      edges.push({ sourceKey: key(gtm), targetKey: key(pi), edge_type: 'REFERENCES', weight: 0.8 })
    }
  }

  return edges
}

function key(n: KnowledgeNode): string {
  return `${n.source_table}:${n.source_id}`
}

// ── syncVentureToGraph ───────────────────────────────────────
// Called after relational saves. Extracts nodes, embeds, upserts.

export async function syncVentureToGraph(
  ventureId: string,
  updates: Partial<Venture>
): Promise<void> {
  const nodes = extractNodes(ventureId, updates)
  if (nodes.length === 0) return

  let embeddings: number[][]
  try {
    embeddings = await embedBatch(nodes.map((n) => n.content.slice(0, 8000)))
  } catch {
    console.warn('Embedding failed, syncing nodes without embeddings')
    embeddings = nodes.map(() => [])
  }

  const rows = nodes.map((n, i) => ({
    venture_id: n.venture_id,
    node_type: n.node_type,
    source_table: n.source_table,
    source_id: n.source_id,
    title: n.title,
    content: n.content,
    metadata: n.metadata,
    embedding: embeddings[i].length ? JSON.stringify(embeddings[i]) : null,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('knowledge_nodes')
    .upsert(rows, { onConflict: 'venture_id,source_table,source_id' })

  if (error) console.error('Knowledge graph sync error:', error)

  // Resolve edges
  const edgeSpecs = inferEdges(nodes)
  if (edgeSpecs.length === 0) return

  const sourceIds = [...new Set([
    ...edgeSpecs.map((e) => e.sourceKey),
    ...edgeSpecs.map((e) => e.targetKey),
  ])]

  const { data: existingNodes } = await supabase
    .from('knowledge_nodes')
    .select('id, source_table, source_id')
    .eq('venture_id', ventureId)
    .in('source_id', sourceIds.map((k) => k.split(':').slice(1).join(':')))

  if (!existingNodes?.length) return

  const idMap = new Map<string, string>()
  for (const n of existingNodes) {
    idMap.set(`${n.source_table}:${n.source_id}`, n.id)
  }

  const edgeRows = edgeSpecs
    .map((e) => {
      const sourceId = idMap.get(e.sourceKey)
      const targetId = idMap.get(e.targetKey)
      if (!sourceId || !targetId) return null
      return {
        source_node_id: sourceId,
        target_node_id: targetId,
        edge_type: e.edge_type,
        weight: e.weight,
        metadata: {},
      }
    })
    .filter(Boolean)

  if (edgeRows.length > 0) {
    await supabase
      .from('knowledge_edges')
      .upsert(edgeRows as NonNullable<(typeof edgeRows)[number]>[], {
        onConflict: 'source_node_id,target_node_id,edge_type',
      })
  }
}

// ── retrieveVentureContext ────────────────────────────────────
// RAG retrieval: embed query, vector search, traverse edges,
// assemble context string.

export async function retrieveVentureContext(
  ventureId: string,
  query: string,
  options?: RetrieveOptions
): Promise<string> {
  const topK = options?.topK ?? 20
  const includeEdges = options?.includeEdges ?? true
  const maxChars = options?.maxChars

  let queryEmbedding: number[]
  try {
    queryEmbedding = await embedQuery(query)
  } catch (embErr) {
    // #region agent log
    fetch('http://127.0.0.1:7526/ingest/2e1cc1bb-e928-47a7-9500-4d4a43c53b51',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f586c6'},body:JSON.stringify({sessionId:'f586c6',location:'knowledgeGraph.ts:retrieveVentureContext',message:'embedQuery failed',data:{ventureId,error:String(embErr)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return ''
  }

  const { data: matches } = await supabase.rpc('match_nodes', {
    query_embedding: JSON.stringify(queryEmbedding),
    p_venture_id: ventureId,
    p_node_types: options?.nodeTypes ?? null,
    match_count: topK,
  })

  const directNodes: MatchedNode[] = (matches ?? []) as MatchedNode[]
  if (directNodes.length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7526/ingest/2e1cc1bb-e928-47a7-9500-4d4a43c53b51',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f586c6'},body:JSON.stringify({sessionId:'f586c6',location:'knowledgeGraph.ts:retrieveVentureContext',message:'RAG: no nodes matched',data:{ventureId},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return ''
  }

  let connectedNodes: ConnectedNode[] = []
  if (includeEdges && directNodes.length > 0) {
    const nodeIds = directNodes.map((n) => n.id)
    const { data: connected } = await supabase.rpc('get_connected_nodes', {
      p_node_ids: nodeIds,
      p_edge_types: null,
      max_count: 15,
    })
    connectedNodes = (connected ?? []) as ConnectedNode[]
  }

  const sections: string[] = []
  const sourceTag = (m: Record<string, unknown> | undefined) =>
    m && typeof m.source === 'string' ? ` | ${m.source}` : ''

  for (const node of directNodes) {
    sections.push(`[${node.node_type}${sourceTag(node.metadata)}] ${node.title}\n${node.content}`)
  }

  if (connectedNodes.length > 0) {
    sections.push('--- RELATED CONTEXT ---')
    for (const node of connectedNodes) {
      sections.push(`[${node.node_type} via ${node.edge_type}${sourceTag(node.metadata)}] ${node.title}\n${node.content}`)
    }
  }

  let result = sections.join('\n\n')
  if (maxChars && result.length > maxChars) {
    result = result.slice(0, maxChars)
  }
  return result
}

// ── deleteVentureNodes ───────────────────────────────────────

export async function deleteVentureNodes(ventureId: string): Promise<void> {
  await supabase.from('knowledge_nodes').delete().eq('venture_id', ventureId)
}
