import { supabase } from '@/lib/supabase'
import { makeTrackedField } from '@/types'
import type { TrackedField } from '@/types'
import type {
  Venture, IcpDocument, CompetitorAnalysis, CompetitorProfile,
  BusinessBriefDocument, ClientListEntry,
  MvpCostModel, UnitEconomicsModel, MarketSizingModel,
  InterviewUpload, InterviewExtraction, CrossInterviewSynthesis,
  MoatAssessment, StrategyMoatSession, VentureCitation, DiscoverResearch,
  IntakeMessage, RiskItem,
  DesignPartnerCandidate, DesignPartnerFeedbackSummary, MvpFeatureItem,
  TechnicalArchitecture, ProductRoadmap, FeaturePrdList, SprintPlan,
  ClientFeedbackSummary, UpdatedRoadmap, PricingLab, PricingImplementationTracker, GtmTracker,
  KpiTracker, TeamMember,
} from '@/types/venture'
import type { LensScoreResult, CompositeSignal } from '@/constants/scoring'
import { syncVentureToGraph } from '@/services/knowledgeGraph'
import { logActivity } from '@/services/activityFeed'

// ── Row types for Supabase responses ─────────────────────────

interface VentureRow {
  id: string
  name_value: string
  name_source: string
  name_timestamp: string
  stage_value: string
  stage_source: string
  founder_value: string
  founder_source: string
  status_value: string
  status_source: string
  description_value: string | null
  description_source: string | null
  created_at: string
  updated_at: string
}

function tracked<T>(value: T, source: string, timestamp?: string): TrackedField<T> {
  return {
    value,
    source: source as TrackedField<T>['source'],
    timestamp: timestamp ?? new Date().toISOString(),
    history: [{ value, source: source as TrackedField<T>['source'], timestamp: timestamp ?? new Date().toISOString() }],
  }
}

// ── Lightweight list (for dashboard/selector) ────────────────

export async function listVenturesFromDb(): Promise<Venture[]> {
  const { data, error } = await supabase
    .from('ventures')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data as VentureRow[]).map((r) => ({
    id: r.id,
    name: tracked(r.name_value, r.name_source, r.name_timestamp),
    stage: tracked(r.stage_value, r.stage_source),
    founder: tracked(r.founder_value, r.founder_source),
    status: tracked(r.status_value, r.status_source),
    ...(r.description_value ? { description: tracked(r.description_value, r.description_source ?? 'FOUNDER') } : {}),
  }))
}

// ── Full hydration ───────────────────────────────────────────

export async function hydrateVenture(id: string): Promise<Venture | null> {
  const [
    ventureRes, intakeRes, scoringRes, icpRes, compsRes, analysisRes,
    ptsRes, insightsRes, clientEntriesRes, clientListRes, fmRes,
    uploadsRes, extractionsRes, synthesisRes, moatRes, sessionsRes,
    briefRes, memoRes, deckRes, citationsRes, researchRes,
    solutionRes, riskRes,
    dpPipelineRes, dpFeedbackRes, mvpFeaturesRes,
    techArchRes, roadmapsRes, prdListRes, sprintRes,
    clientFbRes, updatedRoadmapRes, pricingLabRes,
    pricingImplRes, gtmRes, teamMembersRes,
  ] = await Promise.all([
    supabase.from('ventures').select('*').eq('id', id).single(),
    supabase.from('idea_intakes').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('scoring_results').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('icp_documents').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('competitors').select('*').eq('venture_id', id),
    supabase.from('competitor_analyses').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('pressure_test_sessions').select('*').eq('venture_id', id).order('started_at'),
    supabase.from('saved_insights').select('*').eq('venture_id', id).order('saved_at'),
    supabase.from('client_list_entries').select('*').eq('venture_id', id),
    supabase.from('client_lists').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('financial_models').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('interview_uploads').select('*').eq('venture_id', id).order('uploaded_at'),
    supabase.from('interview_extractions').select('*').eq('venture_id', id),
    supabase.from('cross_interview_syntheses').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('moat_assessments').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('strategy_sessions').select('*').eq('venture_id', id).order('started_at'),
    supabase.from('business_briefs').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('investment_memos').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('pitch_decks').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('venture_citations').select('*').eq('venture_id', id).order('generated_at'),
    supabase.from('discover_research').select('*').eq('venture_id', id).order('generated_at'),
    supabase.from('solution_definitions').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('risk_registers').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('design_partner_pipelines').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('design_partner_feedback_summaries').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('mvp_feature_lists').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('technical_architectures').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('product_roadmaps').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('feature_prd_lists').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('sprint_plans').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('client_feedback_summaries').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('updated_roadmaps').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('pricing_labs').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('pricing_implementation_trackers').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('gtm_trackers').select('*').eq('venture_id', id).maybeSingle(),
    supabase.from('team_members').select('*').eq('venture_id', id).order('added_at'),
  ])

  if (ventureRes.error) return null
  const r = ventureRes.data as VentureRow

  const venture: Venture = {
    id: r.id,
    name: tracked(r.name_value, r.name_source, r.name_timestamp),
    stage: tracked(r.stage_value, r.stage_source),
    founder: tracked(r.founder_value, r.founder_source),
    status: tracked(r.status_value, r.status_source),
    ...(r.description_value ? { description: tracked(r.description_value, r.description_source ?? 'FOUNDER') } : {}),
  }

  // idea_intakes
  if (intakeRes.data) {
    venture.ideaIntake = {
      messages: (intakeRes.data.messages ?? []) as IntakeMessage[],
      dimensionCoverage: (intakeRes.data.dimension_coverage ?? []) as Venture['ideaIntake'] extends undefined ? never : NonNullable<Venture['ideaIntake']>['dimensionCoverage'],
      completed: intakeRes.data.completed ?? false,
    }
  }

  // scoring
  if (scoringRes.data) {
    venture.scoring = {
      corporate: scoringRes.data.corporate as LensScoreResult | undefined,
      vc: scoringRes.data.vc as LensScoreResult | undefined,
      studio: scoringRes.data.studio as LensScoreResult | undefined,
      compositeSignal: scoringRes.data.composite_signal as CompositeSignal | undefined,
    }
  }

  // icp
  if (icpRes.data) {
    const d = icpRes.data
    venture.icpDocument = {
      industry: d.industry,
      industrySegments: d.industry_segments as IcpDocument['industrySegments'],
      companySize: d.company_size,
      buyerRole: d.buyer_role,
      decisionMakingUnit: d.decision_making_unit,
      buyingTrigger: d.buying_trigger ?? undefined,
      painPoints: d.pain_points as IcpDocument['painPoints'],
      buyingCharacteristics: d.buying_characteristics as IcpDocument['buyingCharacteristics'],
      currentAlternatives: d.current_alternatives,
      willingnessToPay: d.willingness_to_pay,
      generatedAt: d.generated_at,
      source: (d.source ?? 'AI_SYNTHESIS') as 'AI_SYNTHESIS',
      founderNotes: d.founder_notes ?? undefined,
      vlNotes: d.vl_notes ?? undefined,
    }
  }

  // competitors
  if (compsRes.data?.length || analysisRes.data) {
    const competitors: CompetitorProfile[] = (compsRes.data ?? []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      websiteUrl: (c.website_url as string) ?? undefined,
      category: (c.category ?? 'Direct') as CompetitorProfile['category'],
      description: (c.description ?? '') as string,
      valueProposition: (c.value_proposition as string) ?? undefined,
      keyFeatures: (c.key_features as string[]) ?? undefined,
      recentNews: (c.recent_news as string) ?? undefined,
      targetIcp: (c.target_icp ?? '') as string,
      pricingModel: (c.pricing_model ?? '') as string,
      fundingScale: (c.funding_scale ?? '') as string,
      keyStrengths: (c.key_strengths ?? '') as string,
      keyWeaknesses: (c.key_weaknesses ?? '') as string,
      threatLevel: (c.threat_level ?? 'Medium') as CompetitorProfile['threatLevel'],
      threatRationale: (c.threat_rationale ?? '') as string,
      ourDifferentiation: (c.our_differentiation ?? '') as string,
      featureComparison: (c.feature_comparison as CompetitorProfile['featureComparison']) ?? undefined,
      competitorSummary: (c.competitor_summary as string) ?? undefined,
      status: (c.status ?? 'pending') as CompetitorProfile['status'],
      rejectionReason: (c.rejection_reason as string) ?? undefined,
      rejectedBy: (c.rejected_by as CompetitorProfile['rejectedBy']) ?? undefined,
      founderComments: (c.founder_comments as string) ?? undefined,
      vlNotes: (c.vl_notes as string) ?? undefined,
      source: 'AI_RESEARCH' as const,
      citations: (c.citations as CompetitorProfile['citations']) ?? undefined,
    }))
    venture.competitorAnalysis = {
      competitors,
      landscapeSummary: analysisRes.data?.landscape_summary ?? undefined,
      citations: analysisRes.data?.citations as CompetitorAnalysis['citations'],
      generatedAt: analysisRes.data?.generated_at ?? new Date().toISOString(),
    }
  }

  // pressure tests
  if (ptsRes.data?.length) {
    venture.pressureTests = ptsRes.data.map((p: Record<string, unknown>) => ({
      personaId: p.persona_id as string,
      personaName: p.persona_name as string,
      messages: (p.messages ?? []) as { role: 'user' | 'assistant'; content: string; timestamp: string }[],
      startedAt: p.started_at as string,
    }))
  }

  // saved insights
  if (insightsRes.data?.length) {
    venture.savedInsights = insightsRes.data.map((i: Record<string, unknown>) => ({
      id: i.id as string,
      personaId: i.persona_id as string,
      personaName: i.persona_name as string,
      content: i.content as string,
      founderResponse: (i.founder_response as string) ?? undefined,
      savedAt: i.saved_at as string,
    }))
  }

  // client list
  if (clientEntriesRes.data?.length || clientListRes.data) {
    const entries: ClientListEntry[] = (clientEntriesRes.data ?? []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      companyName: e.company_name as string,
      industry: (e.industry as string) ?? undefined,
      companySize: (e.company_size as string) ?? undefined,
      rationale: (e.rationale ?? '') as string,
      contactRole: (e.contact_role as string) ?? undefined,
      linkedInUrl: (e.linkedin_url as string) ?? undefined,
      status: (e.status ?? 'candidate') as ClientListEntry['status'],
      notes: (e.notes as string) ?? undefined,
      source: (e.source ?? 'AI_RESEARCH') as ClientListEntry['source'],
      generatedAt: e.generated_at as string,
    }))
    venture.clientList = {
      entries,
      generatedAt: clientListRes.data?.generated_at ?? new Date().toISOString(),
    }
  }

  // financial models
  if (fmRes.data) {
    venture.financialModels = {
      mvpCost: fmRes.data.mvp_cost as MvpCostModel | undefined,
      unitEconomics: fmRes.data.unit_economics as UnitEconomicsModel | undefined,
      marketSizing: fmRes.data.market_sizing as MarketSizingModel | undefined,
    }
  }

  // interviews
  if (uploadsRes.data?.length) {
    const uploads: InterviewUpload[] = uploadsRes.data.map((u: Record<string, unknown>) => ({
      id: u.id as string,
      transcript: (u.transcript ?? '') as string,
      intervieweeRole: u.interviewee_role as InterviewUpload['intervieweeRole'],
      intervieweeCompany: (u.interviewee_company ?? '') as string,
      interviewDate: (u.interview_date ?? '') as string,
      conductedBy: (u.conducted_by ?? 'Founder') as InterviewUpload['conductedBy'],
      interviewType: (u.interview_type ?? '') as string,
      uploadedBy: (u.uploaded_by ?? 'FOUNDER') as InterviewUpload['uploadedBy'],
      uploadedAt: u.uploaded_at as string,
    }))
    const extractions: Record<string, InterviewExtraction> = {}
    for (const ext of extractionsRes.data ?? []) {
      const e = ext as Record<string, unknown>
      extractions[e.upload_id as string] = {
        uploadId: e.upload_id as string,
        painPoints: (e.pain_points ?? []) as InterviewExtraction['painPoints'],
        workarounds: (e.workarounds ?? []) as string[],
        willingnessToPay: (e.willingness_to_pay ?? []) as string[],
        icpMatch: (e.icp_match ?? '') as string,
        featureRequests: (e.feature_requests ?? []) as string[],
        objections: (e.objections ?? []) as string[],
        keyQuotes: (e.key_quotes ?? []) as string[],
        signalQuality: (e.signal_quality ?? 'Moderate') as InterviewExtraction['signalQuality'],
        generatedAt: e.generated_at as string,
      }
    }
    venture.interviews = {
      uploads,
      extractions,
      synthesis: synthesisRes.data ? {
        themes: (synthesisRes.data.themes ?? []) as CrossInterviewSynthesis['themes'],
        contradictions: (synthesisRes.data.contradictions ?? []) as string[],
        topQuotes: (synthesisRes.data.top_quotes ?? []) as string[],
        signalQuality: (synthesisRes.data.signal_quality ?? '') as string,
        generatedAt: synthesisRes.data.generated_at as string,
      } : undefined,
    }
  }

  // strategy & moat
  if (moatRes.data || sessionsRes.data?.length) {
    venture.strategyMoat = {
      assessment: moatRes.data ? {
        recommendedMoats: (moatRes.data.recommended_moats ?? []) as MoatAssessment['recommendedMoats'],
        currentClaims: (moatRes.data.current_claims ?? []) as MoatAssessment['currentClaims'],
        narrative: moatRes.data.narrative ?? undefined,
        generatedAt: moatRes.data.generated_at as string,
      } : undefined,
      sessions: (sessionsRes.data ?? []).map((s: Record<string, unknown>) => ({
        personaId: s.persona_id as string,
        personaName: s.persona_name as string,
        messages: (s.messages ?? []) as StrategyMoatSession['messages'],
        startedAt: s.started_at as string,
      })),
      founderNotes: moatRes.data?.founder_notes ?? undefined,
      vlNotes: moatRes.data?.vl_notes ?? undefined,
    }
  }

  // outputs
  if (briefRes.data) {
    venture.businessBrief = {
      content: briefRes.data.content as BusinessBriefDocument['content'],
      citationIds: (briefRes.data.citation_ids ?? []) as number[],
      generatedAt: briefRes.data.generated_at,
      version: briefRes.data.version ?? 1,
    }
  }
  if (memoRes.data) {
    venture.investmentMemo = {
      content: memoRes.data.content as Record<string, string>,
      citationIds: (memoRes.data.citation_ids ?? []) as number[],
      generatedAt: memoRes.data.generated_at,
      version: memoRes.data.version ?? 1,
    }
  }
  if (deckRes.data) {
    venture.pitchDeck = {
      content: deckRes.data.content as Record<string, string>,
      citationIds: (deckRes.data.citation_ids ?? []) as number[],
      generatedAt: deckRes.data.generated_at,
      version: deckRes.data.version ?? 1,
    }
  }

  // citations
  if (citationsRes.data?.length) {
    venture.citations = citationsRes.data.map((c: Record<string, unknown>) => ({
      id: c.id as string,
      source: c.source as VentureCitation['source'],
      title: (c.title ?? '') as string,
      url: (c.url as string) ?? undefined,
      excerpt: (c.excerpt as string) ?? undefined,
      context: (c.context ?? '') as string,
      dimensionId: (c.dimension_id as string) ?? undefined,
      generatedAt: c.generated_at as string,
    }))
  }

  // discover research
  if (researchRes.data?.length) {
    venture.discover = {
      research: researchRes.data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        type: r.type as DiscoverResearch['type'],
        query: (r.query ?? '') as string,
        content: (r.content ?? '') as string,
        citations: (r.citations ?? []) as DiscoverResearch['citations'],
        source: (r.source ?? 'AI_RESEARCH') as DiscoverResearch['source'],
        generatedAt: r.generated_at as string,
      })),
    }
  }

  // solution definition
  if (solutionRes.data) {
    const sd = solutionRes.data as Record<string, unknown>
    venture.solutionDefinition = {
      whatItDoes: (sd.what_it_does ?? '') as string,
      differentiation: (sd.differentiation ?? '') as string,
      whatItDoesNot: (sd.what_it_does_not ?? '') as string,
      tenXClaim: (sd.ten_x_claim as string) ?? undefined,
      evidence: (sd.evidence as string[]) ?? undefined,
      founderNotes: (sd.founder_notes as string) ?? undefined,
      generatedAt: sd.generated_at as string,
    }
  }

  // risk register
  if (riskRes.data) {
    const rr = riskRes.data as Record<string, unknown>
    venture.riskRegister = {
      risks: (rr.risks ?? []) as RiskItem[],
      founderNotes: (rr.founder_notes as string) ?? undefined,
      generatedAt: rr.generated_at as string,
    }
  }

  // design partner pipeline
  if (dpPipelineRes.data) {
    const dp = dpPipelineRes.data as Record<string, unknown>
    venture.designPartnerPipeline = {
      candidates: (dp.candidates ?? []) as DesignPartnerCandidate[],
      generatedAt: dp.generated_at as string,
    }
  }

  // design partner feedback summary
  if (dpFeedbackRes.data) {
    const fb = dpFeedbackRes.data as Record<string, unknown>
    venture.designPartnerFeedbackSummary = {
      content: fb.content as DesignPartnerFeedbackSummary['content'],
      partnerTags: (fb.partner_tags ?? []) as DesignPartnerFeedbackSummary['partnerTags'],
      generatedAt: fb.generated_at as string,
      version: (fb.version ?? 1) as number,
    }
  }

  // mvp feature list
  if (mvpFeaturesRes.data) {
    const mf = mvpFeaturesRes.data as Record<string, unknown>
    venture.mvpFeatureList = {
      features: (mf.features ?? []) as MvpFeatureItem[],
      generatedAt: mf.generated_at as string,
    }
  }

  // Stage 05
  if (techArchRes.data) {
    const t = techArchRes.data as Record<string, unknown>
    venture.technicalArchitecture = {
      content: t.content as TechnicalArchitecture['content'],
      generatedAt: t.generated_at as string,
      source: (t.source ?? 'AI_SYNTHESIS') as TechnicalArchitecture['source'],
    }
  }
  if (roadmapsRes.data) {
    const r = roadmapsRes.data as Record<string, unknown>
    venture.productRoadmap = {
      phases: (r.phases ?? []) as ProductRoadmap['phases'],
      generatedAt: r.generated_at as string,
      source: (r.source ?? 'AI_SYNTHESIS') as ProductRoadmap['source'],
    }
    venture.ventureSuccessCriteria = (r.venture_success_criteria ?? []) as string[]
    venture.revenueModel = (r.revenue_model ?? '') as string
    venture.businessKpis = (r.business_kpis ?? []) as string[]
  }
  if (prdListRes.data) {
    const p = prdListRes.data as Record<string, unknown>
    venture.featurePrdList = {
      prds: (p.prds ?? []) as FeaturePrdList['prds'],
      generatedAt: p.generated_at as string,
    }
  }
  if (sprintRes.data) {
    const s = sprintRes.data as Record<string, unknown>
    venture.sprintPlan = {
      sprints: (s.sprints ?? []) as SprintPlan['sprints'],
      assumptions: (s.assumptions ?? []) as SprintPlan['assumptions'],
      generatedAt: s.generated_at as string,
      source: (s.source ?? 'AI_SYNTHESIS') as SprintPlan['source'],
    }
  }

  // Stage 06
  if (clientFbRes.data) {
    const c = clientFbRes.data as Record<string, unknown>
    venture.clientFeedbackSummary = {
      content: c.content as ClientFeedbackSummary['content'],
      clientTags: (c.client_tags ?? []) as ClientFeedbackSummary['clientTags'],
      generatedAt: c.generated_at as string,
      source: (c.source ?? 'AI_SYNTHESIS') as ClientFeedbackSummary['source'],
    }
  }
  if (updatedRoadmapRes.data) {
    const u = updatedRoadmapRes.data as Record<string, unknown>
    venture.updatedRoadmap = {
      phases: (u.phases ?? []) as UpdatedRoadmap['phases'],
      generatedAt: u.generated_at as string,
      source: (u.source ?? 'AI_SYNTHESIS') as UpdatedRoadmap['source'],
    }
  }
  if (pricingLabRes.data) {
    const pl = pricingLabRes.data as Record<string, unknown>
    venture.pricingLab = {
      assumptions: (pl.assumptions ?? []) as PricingLab['assumptions'],
      recommendation: pl.recommendation as PricingLab['recommendation'],
      versionHistory: (pl.version_history ?? []) as PricingLab['versionHistory'],
    }
  }

  // Stage 07
  if (pricingImplRes.data) {
    const pi = pricingImplRes.data as Record<string, unknown>
    venture.pricingImplementationTracker = {
      pricingLabSnapshot: pi.pricing_lab_snapshot as PricingImplementationTracker['pricingLabSnapshot'],
      rolloutStatus: (pi.rollout_status ?? '') as string,
      milestones: (pi.milestones ?? []) as string[],
      generatedAt: pi.generated_at as string,
      source: (pi.source ?? 'VL') as PricingImplementationTracker['source'],
    }
  }
  if (gtmRes.data) {
    const g = gtmRes.data as Record<string, unknown>
    venture.gtmTracker = {
      gtmPlan: (g.gtm_plan ?? '') as string,
      pricingImplementationPlan: (g.pricing_implementation_plan ?? '') as string,
      signedSowTracker: (g.signed_sow_tracker ?? []) as GtmTracker['signedSowTracker'],
      acquisitionFunnel: (g.acquisition_funnel ?? []) as GtmTracker['acquisitionFunnel'],
      generatedAt: g.generated_at as string,
      source: (g.source ?? 'VL') as GtmTracker['source'],
    }
  }

  if (teamMembersRes.data) {
    venture.teamMembers = (teamMembersRes.data as Record<string, unknown>[]).map((tm) => ({
      id: tm.id as string,
      name: tm.name as string,
      role: tm.role as string,
      email: tm.email as string | undefined,
      allocationPct: (tm.allocation_pct ?? 100) as number,
      addedAt: tm.added_at as string,
      updatedAt: tm.updated_at as string,
    })) as TeamMember[]
  }

  return venture
}

// ── Create venture ───────────────────────────────────────────

export async function createVentureInDb(name: string): Promise<Venture> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const payload: Record<string, unknown> = {
    id,
    name_value: name.trim(),
    name_source: 'FOUNDER',
    name_timestamp: now,
    stage_value: '02',
    stage_source: 'VL',
    founder_value: 'Founder',
    founder_source: 'VL',
    status_value: 'On Track',
    status_source: 'VL',
  }

  const { error: ventureError } = await supabase.from('ventures').insert(payload)

  if (ventureError) throw ventureError

  const { error: intakeError } = await supabase
    .from('idea_intakes')
    .insert({
      venture_id: id,
      messages: [],
      dimension_coverage: [],
      completed: false,
    })

  if (intakeError) throw intakeError

  const venture: Venture = {
    id,
    name: makeTrackedField(name.trim(), 'FOUNDER'),
    stage: makeTrackedField('02', 'VL'),
    founder: makeTrackedField('Founder', 'VL'),
    status: makeTrackedField('On Track', 'VL'),
    ideaIntake: { messages: [], dimensionCoverage: [], completed: false },
  }

  syncVentureToGraph(id, venture).catch(() => {})

  return venture
}

// ── Save partial updates ─────────────────────────────────────

export async function saveVentureUpdates(id: string, updates: Partial<Venture>): Promise<void> {
  const ops: Promise<void>[] = []

  const run = (fn: () => PromiseLike<unknown>): void => {
    ops.push(Promise.resolve(fn()).then(() => {}))
  }

  // Core fields
  if (updates.name || updates.stage || updates.founder || updates.status || updates.description) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.name) { patch.name_value = updates.name.value; patch.name_source = updates.name.source; patch.name_timestamp = updates.name.timestamp }
    if (updates.stage) {
      patch.stage_value = updates.stage.value
      patch.stage_source = updates.stage.source
      run(async () => {
        const { data } = await supabase.from('ventures').select('stage_value').eq('id', id).single()
        const fromStage = (data as { stage_value?: string } | null)?.stage_value
        await logActivity({
          ventureId: id,
          action: 'stage_changed',
          details: { fromStage, toStage: updates.stage!.value },
        }).catch(() => {})
      })
    }
    if (updates.founder) { patch.founder_value = updates.founder.value; patch.founder_source = updates.founder.source }
    if (updates.status) { patch.status_value = updates.status.value; patch.status_source = updates.status.source }
    if (updates.description) { patch.description_value = updates.description.value; patch.description_source = updates.description.source }
    run(() => supabase.from('ventures').update(patch).eq('id', id))
  }

  if (updates.ideaIntake) {
    run(() => supabase.from('idea_intakes').upsert({
      venture_id: id,
      messages: updates.ideaIntake!.messages,
      dimension_coverage: updates.ideaIntake!.dimensionCoverage,
      completed: updates.ideaIntake!.completed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }

  if (updates.scoring) {
    run(() => supabase.from('scoring_results').upsert({
      venture_id: id,
      corporate: updates.scoring!.corporate ?? null,
      vc: updates.scoring!.vc ?? null,
      studio: updates.scoring!.studio ?? null,
      composite_signal: updates.scoring!.compositeSignal ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }

  if (updates.icpDocument) {
    const icp = updates.icpDocument
    run(() => supabase.from('icp_documents').upsert({
      venture_id: id,
      industry: icp.industry,
      industry_segments: icp.industrySegments ?? null,
      company_size: icp.companySize,
      buyer_role: icp.buyerRole,
      decision_making_unit: icp.decisionMakingUnit,
      buying_trigger: icp.buyingTrigger ?? null,
      pain_points: icp.painPoints ?? null,
      buying_characteristics: icp.buyingCharacteristics ?? null,
      current_alternatives: icp.currentAlternatives,
      willingness_to_pay: icp.willingnessToPay,
      generated_at: icp.generatedAt,
      source: icp.source,
      founder_notes: icp.founderNotes ?? null,
      vl_notes: icp.vlNotes ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }

  if (updates.competitorAnalysis) {
    const ca = updates.competitorAnalysis
    run(() => supabase.from('competitor_analyses').upsert({
      venture_id: id,
      landscape_summary: ca.landscapeSummary ?? null,
      citations: ca.citations ?? null,
      generated_at: ca.generatedAt,
    }, { onConflict: 'venture_id' }))

    ops.push((async () => {
      await supabase.from('competitors').delete().eq('venture_id', id)
      if (ca.competitors?.length) {
        await supabase.from('competitors').insert(
          ca.competitors.map((c) => ({
            id: c.id,
            venture_id: id,
            name: c.name,
            website_url: c.websiteUrl ?? null,
            category: c.category,
            description: c.description,
            value_proposition: c.valueProposition ?? null,
            key_features: c.keyFeatures ?? null,
            recent_news: c.recentNews ?? null,
            target_icp: c.targetIcp,
            pricing_model: c.pricingModel,
            funding_scale: c.fundingScale,
            key_strengths: c.keyStrengths,
            key_weaknesses: c.keyWeaknesses,
            threat_level: c.threatLevel,
            threat_rationale: c.threatRationale,
            our_differentiation: c.ourDifferentiation,
            feature_comparison: c.featureComparison ?? null,
            competitor_summary: c.competitorSummary ?? null,
            status: c.status,
            rejection_reason: c.rejectionReason ?? null,
            rejected_by: c.rejectedBy ?? null,
            founder_comments: c.founderComments ?? null,
            vl_notes: c.vlNotes ?? null,
            source: c.source,
            citations: c.citations ?? null,
          }))
        )
      }
    })())
  }

  if (updates.pressureTests) {
    ops.push((async () => {
      await supabase.from('pressure_test_sessions').delete().eq('venture_id', id)
      if (updates.pressureTests!.length) {
        await supabase.from('pressure_test_sessions').insert(
          updates.pressureTests!.map((p) => ({
            venture_id: id,
            persona_id: p.personaId,
            persona_name: p.personaName,
            messages: p.messages,
            started_at: p.startedAt,
          }))
        )
      }
    })())
  }

  if (updates.savedInsights) {
    ops.push((async () => {
      await supabase.from('saved_insights').delete().eq('venture_id', id)
      if (updates.savedInsights!.length) {
        await supabase.from('saved_insights').insert(
          updates.savedInsights!.map((i) => ({
            id: i.id,
            venture_id: id,
            persona_id: i.personaId,
            persona_name: i.personaName,
            content: i.content,
            founder_response: i.founderResponse ?? null,
            saved_at: i.savedAt,
          }))
        )
      }
    })())
  }

  if (updates.clientList) {
    run(() => supabase.from('client_lists').upsert({
      venture_id: id,
      generated_at: updates.clientList!.generatedAt,
    }, { onConflict: 'venture_id' }))

    ops.push((async () => {
      await supabase.from('client_list_entries').delete().eq('venture_id', id)
      if (updates.clientList!.entries.length) {
        await supabase.from('client_list_entries').insert(
          updates.clientList!.entries.map((e) => ({
            id: e.id,
            venture_id: id,
            company_name: e.companyName,
            industry: e.industry ?? null,
            company_size: e.companySize ?? null,
            rationale: e.rationale,
            contact_role: e.contactRole ?? null,
            linkedin_url: e.linkedInUrl ?? null,
            status: e.status,
            notes: e.notes ?? null,
            source: e.source,
            generated_at: e.generatedAt,
          }))
        )
      }
    })())
  }

  if (updates.financialModels) {
    run(() => supabase.from('financial_models').upsert({
      venture_id: id,
      mvp_cost: updates.financialModels!.mvpCost ?? null,
      unit_economics: updates.financialModels!.unitEconomics ?? null,
      market_sizing: updates.financialModels!.marketSizing ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }

  if (updates.interviews) {
    const iv = updates.interviews
    ops.push((async () => {
      await supabase.from('interview_uploads').delete().eq('venture_id', id)
      if (iv.uploads.length) {
        await supabase.from('interview_uploads').insert(
          iv.uploads.map((u) => ({
            id: u.id,
            venture_id: id,
            transcript: u.transcript,
            interviewee_role: u.intervieweeRole,
            interviewee_company: u.intervieweeCompany,
            interview_date: u.interviewDate,
            conducted_by: u.conductedBy,
            interview_type: u.interviewType,
            uploaded_by: u.uploadedBy,
            uploaded_at: u.uploadedAt,
          }))
        )
      }
    })())

    ops.push((async () => {
      await supabase.from('interview_extractions').delete().eq('venture_id', id)
      const rows = Object.entries(iv.extractions).map(([uploadId, ext]) => ({
        upload_id: uploadId,
        venture_id: id,
        pain_points: ext.painPoints,
        workarounds: ext.workarounds,
        willingness_to_pay: ext.willingnessToPay,
        icp_match: ext.icpMatch,
        feature_requests: ext.featureRequests,
        objections: ext.objections,
        key_quotes: ext.keyQuotes,
        signal_quality: ext.signalQuality,
        generated_at: ext.generatedAt,
      }))
      if (rows.length) await supabase.from('interview_extractions').insert(rows)
    })())

    if (iv.synthesis) {
      run(() => supabase.from('cross_interview_syntheses').upsert({
        venture_id: id,
        themes: iv.synthesis!.themes,
        contradictions: iv.synthesis!.contradictions,
        top_quotes: iv.synthesis!.topQuotes,
        signal_quality: iv.synthesis!.signalQuality,
        generated_at: iv.synthesis!.generatedAt,
      }, { onConflict: 'venture_id' }))
    }
  }

  if (updates.strategyMoat) {
    const sm = updates.strategyMoat
    if (sm.assessment) {
      run(() => supabase.from('moat_assessments').upsert({
        venture_id: id,
        recommended_moats: sm.assessment!.recommendedMoats,
        current_claims: sm.assessment!.currentClaims,
        narrative: sm.assessment!.narrative ?? null,
        founder_notes: sm.founderNotes ?? null,
        vl_notes: sm.vlNotes ?? null,
        generated_at: sm.assessment!.generatedAt,
      }, { onConflict: 'venture_id' }))
    }
    if (sm.sessions) {
      ops.push((async () => {
        await supabase.from('strategy_sessions').delete().eq('venture_id', id)
        if (sm.sessions!.length) {
          await supabase.from('strategy_sessions').insert(
            sm.sessions!.map((s) => ({
              venture_id: id,
              persona_id: s.personaId,
              persona_name: s.personaName,
              messages: s.messages,
              started_at: s.startedAt,
            }))
          )
        }
      })())
    }
  }

  if (updates.businessBrief) {
    run(() => supabase.from('business_briefs').upsert({
      venture_id: id,
      content: updates.businessBrief!.content,
      citation_ids: updates.businessBrief!.citationIds,
      generated_at: updates.businessBrief!.generatedAt,
      version: updates.businessBrief!.version,
    }, { onConflict: 'venture_id' }))
  }

  if (updates.investmentMemo) {
    run(() => supabase.from('investment_memos').upsert({
      venture_id: id,
      content: updates.investmentMemo!.content,
      citation_ids: updates.investmentMemo!.citationIds,
      generated_at: updates.investmentMemo!.generatedAt,
      version: updates.investmentMemo!.version,
    }, { onConflict: 'venture_id' }))
  }

  if (updates.pitchDeck) {
    run(() => supabase.from('pitch_decks').upsert({
      venture_id: id,
      content: updates.pitchDeck!.content,
      citation_ids: updates.pitchDeck!.citationIds,
      generated_at: updates.pitchDeck!.generatedAt,
      version: updates.pitchDeck!.version,
    }, { onConflict: 'venture_id' }))
  }

  if (updates.citations) {
    ops.push((async () => {
      await supabase.from('venture_citations').delete().eq('venture_id', id)
      if (updates.citations!.length) {
        await supabase.from('venture_citations').insert(
          updates.citations!.map((c) => ({
            id: c.id,
            venture_id: id,
            source: c.source,
            title: c.title,
            url: c.url ?? null,
            excerpt: c.excerpt ?? null,
            context: c.context,
            dimension_id: c.dimensionId ?? null,
            generated_at: c.generatedAt,
          }))
        )
      }
    })())
  }

  if (updates.discover) {
    ops.push((async () => {
      await supabase.from('discover_research').delete().eq('venture_id', id)
      if (updates.discover!.research.length) {
        await supabase.from('discover_research').insert(
          updates.discover!.research.map((r) => ({
            id: r.id,
            venture_id: id,
            type: r.type,
            query: r.query,
            content: r.content,
            citations: r.citations,
            source: r.source,
            generated_at: r.generatedAt,
          }))
        )
      }
    })())
  }

  if (updates.solutionDefinition) {
    const sd = updates.solutionDefinition
    run(() => supabase.from('solution_definitions').upsert({
      venture_id: id,
      what_it_does: sd.whatItDoes,
      differentiation: sd.differentiation,
      what_it_does_not: sd.whatItDoesNot,
      ten_x_claim: sd.tenXClaim ?? null,
      evidence: sd.evidence ?? [],
      founder_notes: sd.founderNotes ?? null,
      generated_at: sd.generatedAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }

  if (updates.riskRegister) {
    const rr = updates.riskRegister
    run(() => supabase.from('risk_registers').upsert({
      venture_id: id,
      risks: rr.risks,
      founder_notes: rr.founderNotes ?? null,
      generated_at: rr.generatedAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }

  if (updates.designPartnerPipeline) {
    const dp = updates.designPartnerPipeline
    run(() => supabase.from('design_partner_pipelines').upsert({
      venture_id: id,
      candidates: dp.candidates,
      generated_at: dp.generatedAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }

  if (updates.designPartnerFeedbackSummary) {
    const fb = updates.designPartnerFeedbackSummary
    run(() => supabase.from('design_partner_feedback_summaries').upsert({
      venture_id: id,
      content: fb.content,
      partner_tags: fb.partnerTags,
      generated_at: fb.generatedAt,
      version: fb.version,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }

  if (updates.mvpFeatureList) {
    const mf = updates.mvpFeatureList
    run(() => supabase.from('mvp_feature_lists').upsert({
      venture_id: id,
      features: mf.features,
      generated_at: mf.generatedAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }

  if (updates.technicalArchitecture) {
    const t = updates.technicalArchitecture
    run(() => supabase.from('technical_architectures').upsert({
      venture_id: id,
      content: t.content,
      generated_at: t.generatedAt,
      source: t.source,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }
  if (
    updates.productRoadmap ||
    updates.ventureSuccessCriteria !== undefined ||
    updates.revenueModel !== undefined ||
    updates.businessKpis !== undefined ||
    updates.kpiTracker !== undefined
  ) {
    const r = updates.productRoadmap
    const vsc = updates.ventureSuccessCriteria
    const revModel = updates.revenueModel
    const bizKpis = updates.businessKpis
    const kpiTracker = updates.kpiTracker
    run(async () => {
      const { data: existing } = await supabase.from('product_roadmaps').select('*').eq('venture_id', id).maybeSingle()
      const now = new Date().toISOString()
      const payload = {
        venture_id: id,
        phases: r?.phases ?? existing?.phases ?? [],
        generated_at: r?.generatedAt ?? existing?.generated_at ?? now,
        source: r?.source ?? existing?.source ?? 'VL',
        venture_success_criteria: vsc ?? existing?.venture_success_criteria ?? [],
        revenue_model: revModel ?? existing?.revenue_model ?? '',
        business_kpis: bizKpis ?? existing?.business_kpis ?? [],
        kpi_tracker: kpiTracker ?? existing?.kpi_tracker ?? { definitions: [], snapshots: [] },
        updated_at: now,
      }
      await supabase.from('product_roadmaps').upsert(payload, { onConflict: 'venture_id' })
    })
  }
  if (updates.featurePrdList) {
    const p = updates.featurePrdList
    run(() => supabase.from('feature_prd_lists').upsert({
      venture_id: id,
      prds: p.prds,
      generated_at: p.generatedAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }
  if (updates.sprintPlan) {
    const s = updates.sprintPlan
    run(() => supabase.from('sprint_plans').upsert({
      venture_id: id,
      sprints: s.sprints,
      assumptions: s.assumptions,
      generated_at: s.generatedAt,
      source: s.source,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }
  if (updates.clientFeedbackSummary) {
    const c = updates.clientFeedbackSummary
    run(() => supabase.from('client_feedback_summaries').upsert({
      venture_id: id,
      content: c.content,
      client_tags: c.clientTags,
      generated_at: c.generatedAt,
      source: c.source,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }
  if (updates.updatedRoadmap) {
    const u = updates.updatedRoadmap
    run(() => supabase.from('updated_roadmaps').upsert({
      venture_id: id,
      phases: u.phases,
      generated_at: u.generatedAt,
      source: u.source,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }
  if (updates.pricingLab) {
    const pl = updates.pricingLab
    run(() => supabase.from('pricing_labs').upsert({
      venture_id: id,
      assumptions: pl.assumptions,
      recommendation: pl.recommendation ?? null,
      version_history: pl.versionHistory ?? [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }
  if (updates.pricingImplementationTracker) {
    const pi = updates.pricingImplementationTracker
    run(() => supabase.from('pricing_implementation_trackers').upsert({
      venture_id: id,
      pricing_lab_snapshot: pi.pricingLabSnapshot ?? null,
      rollout_status: pi.rolloutStatus,
      milestones: pi.milestones,
      generated_at: pi.generatedAt,
      source: pi.source,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }
  if (updates.gtmTracker) {
    const g = updates.gtmTracker
    run(() => supabase.from('gtm_trackers').upsert({
      venture_id: id,
      gtm_plan: g.gtmPlan,
      pricing_implementation_plan: g.pricingImplementationPlan,
      signed_sow_tracker: g.signedSowTracker,
      acquisition_funnel: g.acquisitionFunnel ?? [],
      generated_at: g.generatedAt,
      source: g.source,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'venture_id' }))
  }
  if (updates.teamMembers) {
    const members = updates.teamMembers
    run(async () => {
      await supabase.from('team_members').delete().eq('venture_id', id)
      if (members.length > 0) {
        const rows = members.map((m) => ({
          id: m.id,
          venture_id: id,
          name: m.name,
          role: m.role,
          email: m.email ?? null,
          allocation_pct: m.allocationPct ?? 100,
          added_at: m.addedAt,
          updated_at: m.updatedAt ?? m.addedAt,
        }))
        const { error } = await supabase.from('team_members').insert(rows)
        if (error) throw error
      }
    })
  }

  await Promise.all(ops)

  // Sync to knowledge graph (fire and forget)
  syncVentureToGraph(id, updates).catch((e) =>
    console.warn('Knowledge graph sync failed:', e)
  )
}

// ── Legacy compatibility ─────────────────────────────────────

export async function updateVentureInDb(id: string, venture: Venture): Promise<void> {
  await saveVentureUpdates(id, venture)
}

export async function getVentureFromDb(id: string): Promise<Venture | null> {
  return hydrateVenture(id)
}
