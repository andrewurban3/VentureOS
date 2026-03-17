import { aiService } from '@/services/ai'
import type { Venture } from '@/types/venture'
import { evaluateGateOkrs } from '@/constants/gateOkrs'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

export interface GateRecommendation {
  krLabel: string
  approach: string
  risk: string
}

const KR_TO_TAB: Record<string, { stage: string; tab: string }> = {
  icp_defined: { stage: '02', tab: 'ICP Builder' },
  pressure_tests: { stage: '02', tab: 'Pressure Test' },
  signal_advance: { stage: '02', tab: 'Scoring' },
  tam_1b: { stage: '03', tab: 'Financial Models (Market Sizing)' },
  cagr_20: { stage: '03', tab: 'Financial Models (Market Sizing)' },
  competitor_landscape: { stage: '02', tab: 'Competitors' },
  competitors_3: { stage: '02', tab: 'Competitors' },
  business_brief: { stage: '02', tab: 'Business Brief' },
  scoring_complete: { stage: '02', tab: 'Scoring' },
  citations: { stage: '02', tab: 'Business Brief' },
  interviews_5: { stage: '03', tab: 'Interview Insights' },
  synthesis: { stage: '03', tab: 'Interview Insights' },
  client_list_10: { stage: '03', tab: 'Client List' },
  mvp_cost: { stage: '03', tab: 'Financial Models (MVP Cost)' },
  unit_economics: { stage: '03', tab: 'Financial Models (Unit Economics)' },
  market_sizing: { stage: '03', tab: 'Financial Models (Market Sizing)' },
  solution_definition: { stage: '03', tab: 'Solution' },
  strategy_moat: { stage: '03', tab: 'Strategy & Moat' },
  risk_register_5: { stage: '03', tab: 'Risk Mitigation' },
  investment_doc: { stage: '03', tab: 'Outputs' },
  signed_3: { stage: '04', tab: 'Design Partners' },
  pipeline_5: { stage: '04', tab: 'Design Partners' },
  qual_score_60: { stage: '04', tab: 'Design Partners' },
  feedback_summary: { stage: '04', tab: 'Feedback Summary' },
  mvp_features_5: { stage: '04', tab: 'MVP Features' },
  product_gaps: { stage: '04', tab: 'Feedback Summary' },
  architecture: { stage: '05', tab: 'Architecture' },
  sprint_plan: { stage: '05', tab: 'Sprint Plan' },
  feature_prds: { stage: '05', tab: 'Feature PRDs' },
  roadmap_phases: { stage: '05', tab: 'Roadmap' },
  business_kpis: { stage: '05', tab: 'Business' },
  revenue_model: { stage: '05', tab: 'Business' },
  team_members_2: { stage: '05', tab: 'Business' },
  client_feedback: { stage: '06', tab: 'Client Feedback' },
  updated_roadmap: { stage: '06', tab: 'Roadmap Updater' },
  positive_signals: { stage: '06', tab: 'Client Feedback' },
  pricing_recommendation: { stage: '06', tab: 'Pricing Lab' },
  pricing_implementation: { stage: '07', tab: 'Pricing Tracker' },
}

const KR_RISK_DESCRIPTIONS: Record<string, string> = {
  icp_defined:
    'Without a defined ICP, all downstream work (scoring, outreach, interviews) targets the wrong customer, wasting time and resources.',
  pressure_tests:
    'Insufficient pressure testing leaves unchallenged assumptions that can surface late in design partner conversations or pilot, forcing costly pivots.',
  signal_advance:
    'A non-Advance composite signal indicates weak fit across corporate, VC, or studio lenses, reducing confidence in continued investment.',
  tam_1b:
    'A market under $1B TAM signals limited upside, making it harder to justify continued investment from the studio.',
  cagr_20:
    'Low market growth means the venture must steal share rather than ride a wave, dramatically increasing go-to-market cost.',
  competitor_landscape:
    'Without a mapped competitor landscape, differentiation claims are unvalidated and the venture may enter crowded or commoditized segments.',
  competitors_3:
    'Fewer than three competitors analyzed leaves blind spots in positioning and pricing strategy.',
  business_brief:
    'A missing business brief means the investment thesis is not clearly articulated, slowing stakeholder alignment and gate decisions.',
  scoring_complete:
    'Incomplete scoring across lenses leaves gaps in how different stakeholders view the venture, risking misaligned expectations.',
  citations:
    'Unsupported claims weaken credibility with gate reviewers and investors; citations anchor the narrative in evidence.',
  interviews_5:
    'Fewer customer interviews mean problem validation rests on thin evidence, increasing the risk of building for the wrong need.',
  synthesis:
    'Without cross-interview synthesis, themes and contradictions remain hidden, making it harder to prioritize features and validate the solution.',
  client_list_10:
    'A short client list limits pipeline for design partners and pilots, extending time to validation.',
  mvp_cost:
    'Without an MVP cost model, build scope and budget are undefined, risking over-investment or under-resourcing.',
  unit_economics:
    'Without validated unit economics, you risk committing build resources to a financially unviable model.',
  market_sizing:
    'Missing market sizing leaves TAM/SAM/SOM and growth assumptions unvalidated, weakening the investment case.',
  solution_definition:
    'An undefined solution blurs scope and differentiation, making it harder for design partners and the team to align.',
  strategy_moat:
    'Without a moat assessment, defensibility is unclear and the venture may be easily copied once traction appears.',
  risk_register_5:
    'A sparse risk register means key threats are unidentified; unmitigated risks can derail the venture post-gate.',
  investment_doc:
    'Missing investment memo or pitch deck slows due diligence and stakeholder buy-in for the next stage.',
  signed_3:
    'Fewer than three signed design partners limits co-creation feedback and early revenue validation.',
  pipeline_5:
    'A thin pipeline increases dependency on a few prospects and slows design partner conversion.',
  qual_score_60:
    'Low qualification scores suggest design partners may not fit the ICP, reducing the value of feedback and validation.',
  feedback_summary:
    'Without a feedback summary, design partner insights remain fragmented and product direction is less informed.',
  mvp_features_5:
    'Fewer MVP features leave scope ambiguous and may under-serve design partners or over-build for early validation.',
  product_gaps:
    'Unidentified product gaps mean the venture may ship without addressing critical partner feedback.',
  architecture:
    'Missing technical architecture increases build risk, integration issues, and technical debt.',
  sprint_plan:
    'Without a sprint plan, delivery milestones are undefined and the team may over-commit or under-deliver.',
  feature_prds:
    'Missing feature PRDs leave acceptance criteria and scope unclear, slowing development and increasing rework.',
  roadmap_phases:
    'A roadmap without phases makes it harder to sequence investment and measure progress.',
  business_kpis:
    'Undefined business KPIs leave success criteria vague, making it harder to evaluate pilot and commercial outcomes.',
  revenue_model:
    'An undocumented revenue model leaves pricing and monetization assumptions unvalidated.',
  team_members_2:
    'Insufficient team assignment risks delivery delays and knowledge concentration in too few people.',
  client_feedback:
    'Without captured client feedback, pilot learnings are lost and product iteration is uninformed.',
  updated_roadmap:
    'An outdated roadmap that ignores pilot learnings can steer the venture in the wrong direction.',
  positive_signals:
    'Missing positive signal themes means the venture lacks evidence that the solution resonates with customers.',
  pricing_recommendation:
    'Without a pricing recommendation, the venture may under-price or misalign pricing with value.',
  pricing_implementation:
    'A missing pricing implementation plan delays revenue capture and commercial readiness.',
}

export async function generateGateRecommendations(
  venture: Venture,
  fromStage: string,
  toStage: string
): Promise<GateRecommendation[]> {
  const { allScores } = evaluateGateOkrs(venture, fromStage, toStage)
  const gaps = allScores.filter((r) => r.score < 100)

  if (gaps.length === 0) {
    return [
      {
        krLabel: 'All criteria met',
        approach: 'All OKR criteria are met. Ready to request gate advancement.',
        risk: 'None.',
      },
    ]
  }

  const ragQuery = `Stage gate readiness gaps: ${gaps.map((g) => g.label).join(', ')}. Strategic approach, risks, ICP, financials, competitors, interviews, solution.`
  let ventureContext: string
  try {
    ventureContext = await retrieveVentureContext(venture.id, ragQuery, {
      topK: 30,
      maxChars: 10000,
    })
  } catch {
    ventureContext = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }
  if (!ventureContext) {
    ventureContext = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const gapDescriptions = gaps
    .map((g) => {
      const tabInfo = KR_TO_TAB[g.krId]
      const where = tabInfo ? ` (${tabInfo.tab})` : ''
      return `- ${g.label}: ${g.score}%${where}`
    })
    .join('\n')

  const systemPrompt = `You are a venture studio advisor. Given a venture's stage gate OKR gaps and venture context, produce strategic recommendations for each gap.

For each gap, provide:
1. **Approach**: Best strategy to achieve the OKR, with specific tactics. Be venture-specific using the venture context (ICP, scoring, competitors, financials, etc.). Avoid generic advice like "Go to X tab"—instead explain HOW to achieve the OKR (e.g. "To hit TAM > $1B, consider broadening your ICP to adjacent industry segments and re-running market sizing with the expanded definition").
2. **Risk**: What happens if this OKR remains unmet at gate review. Be concrete about consequences (e.g. "Without validated unit economics, you risk committing build resources to a financially unviable model and delaying pivot decisions").

Order by impact (most critical gaps first). Be concise but substantive—2-4 sentences per approach and risk.`

  const userMessage = `Venture: ${venture.name?.value ?? 'Unnamed'}
Gate: ${fromStage} → ${toStage}

VENTURE CONTEXT:
${ventureContext}

OKR gaps (score < 100%):
${gapDescriptions}

For each gap above, produce one recommendation object with krLabel (the OKR label), approach (strategy + tactics), and risk (consequences of not meeting it).`

  try {
    const result = await aiService.chatWithStructuredOutput<{
      recommendations: GateRecommendation[]
    }>({
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 1500,
      schemaHint: 'Array of { krLabel: string, approach: string, risk: string }',
    })

    const recs = result?.recommendations
    if (Array.isArray(recs) && recs.length > 0) {
      return recs.map((r) => ({
        krLabel: String(r?.krLabel ?? ''),
        approach: String(r?.approach ?? ''),
        risk: String(r?.risk ?? ''),
      }))
    }

    throw new Error('Invalid response shape')
  } catch (e) {
    console.error('generateGateRecommendations:', e)
    return gaps.map((g) => {
      const tabInfo = KR_TO_TAB[g.krId]
      const tabHint = tabInfo ? ` via ${tabInfo.tab}` : ''
      const risk =
        KR_RISK_DESCRIPTIONS[g.krId] ??
        'This gap weakens the venture case and may delay or block gate advancement.'
      return {
        krLabel: g.label,
        approach: `Complete "${g.label}"${tabHint}. Use the app tabs to fill in the required data.`,
        risk,
      }
    })
  }
}
