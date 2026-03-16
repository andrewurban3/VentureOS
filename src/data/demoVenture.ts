import { makeTrackedField } from '@/types'
import type { Venture } from '@/types/venture'

/**
 * Returns a partial Venture payload to seed a demo venture so all sections
 * (Idea Intake, ICP, Competitors, Pressure Test, Saved Insights, Scoring,
 * Client List, Financial Models, Strategy & Moat, Discover Research) have data.
 *
 * Usage: createVentureInDb('Demo: B2B Compliance SaaS') then saveVentureUpdates(id, getDemoVenturePayload()).
 */
export function getDemoVenturePayload(): Partial<Venture> {
  const now = new Date().toISOString()
  return {
    name: makeTrackedField('Demo: B2B Compliance SaaS', 'VL'),
    stage: makeTrackedField('02', 'VL'),
    founder: makeTrackedField('Demo Founder', 'VL'),
    status: makeTrackedField('On Track', 'VL'),
    description: makeTrackedField(
      'Compliance workflow SaaS for mid-market financial services. Automates policy attestation and audit prep.',
      'VL'
    ),

    // ── Idea Intake ──────────────────────────────────────────
    ideaIntake: {
      messages: [
        {
          role: 'user',
          content: 'We are building a B2B SaaS that helps mid-market banks and insurers automate compliance attestation and audit preparation. The pain is manual spreadsheets and email chains that break down during audits.',
          source: 'FOUNDER',
          timestamp: now,
        },
        {
          role: 'assistant',
          content: "That\u2019s a clear problem. Who exactly feels this pain most \u2014 compliance officers, internal audit, or both?",
          source: 'VERA',
          timestamp: now,
        },
        {
          role: 'user',
          content: 'Compliance and risk officers, plus internal audit. Company size we\u2019re going after is 500\u20135000 employees, regulated financial services.',
          source: 'FOUNDER',
          timestamp: now,
        },
        {
          role: 'assistant',
          content: 'Understood. What does the solution do in its minimum form?',
          source: 'VERA',
          timestamp: now,
        },
        {
          role: 'user',
          content: 'Single dashboard for policy attestation, evidence collection, and audit-ready reports. Integrates with existing GRC tools via API. We\u2019re not replacing the GRC stack \u2014 we\u2019re the layer that makes audit prep actually work.',
          source: 'FOUNDER',
          timestamp: now,
        },
      ],
      dimensionCoverage: [
        { id: '01', status: 'complete', summary: 'Core concept: compliance attestation and audit prep SaaS for mid-market financial services.', flags: [] },
        { id: '02', status: 'complete', summary: 'Pain: manual spreadsheets, email chains, audit failures.', flags: [] },
        { id: '03', status: 'complete', summary: 'ICP: compliance/risk officers, internal audit, 500\u20135k employees, regulated FS.', flags: [] },
        { id: '04', status: 'complete', summary: 'Solution: dashboard for attestation, evidence, audit reports; API to GRC tools.', flags: [] },
        { id: '05', status: 'in_progress', summary: 'Revenue: subscription per seat or per module; pilot then annual.', flags: [] },
        { id: '06', status: 'in_progress', summary: 'Market: mid-market GRC/compliance software segment.', flags: [] },
        { id: '07', status: 'not_started', summary: '', flags: [] },
        { id: '08', status: 'not_started', summary: '', flags: [] },
        { id: '09', status: 'not_started', summary: '', flags: [] },
        { id: '10', status: 'not_started', summary: '', flags: [] },
      ],
      completed: false,
    },

    // ── Scoring ──────────────────────────────────────────────
    scoring: {
      corporate: {
        dimensions: [
          { id: 'market', name: 'Market Opportunity', score: 8, explanation: 'GRC/compliance software market growing 14% CAGR; mid-market under-served.', whyItMatters: 'Large addressable market signals sustainable revenue potential.' },
          { id: 'team', name: 'Team Fit', score: 7, explanation: 'Founder has compliance domain expertise; needs technical co-founder.', whyItMatters: 'Domain expertise de-risks go-to-market; technical gap is fillable.' },
          { id: 'defensibility', name: 'Defensibility', score: 6, explanation: 'Workflow integration creates switching costs but no hard IP moat yet.', whyItMatters: 'Switching costs buy time; need to build data moat.' },
        ],
        average: 7.0,
        recommendation: 'Strong corporate innovation fit. Mid-market compliance is under-served and aligns with regulated-industry portfolios.',
      },
      vc: {
        dimensions: [
          { id: 'market', name: 'Market Size', score: 8, explanation: 'TAM north of $12B in GRC; SAM for mid-market audit-prep ~$1.5B.', whyItMatters: 'Venture-scale market is a prerequisite for Series A.' },
          { id: 'traction', name: 'Traction', score: 5, explanation: 'Pre-revenue; two LOIs from regional banks.', whyItMatters: 'LOIs are positive signal but revenue is the real proof point.' },
          { id: 'scalability', name: 'Scalability', score: 7, explanation: 'SaaS model with per-seat pricing scales well; API-first architecture.', whyItMatters: 'Efficient scaling drives attractive unit economics at growth.' },
        ],
        average: 6.7,
        recommendation: 'Promising but early. Needs to convert LOIs to paid pilots before raising.',
      },
      studio: {
        dimensions: [
          { id: 'buildability', name: 'Buildability', score: 8, explanation: 'Clear MVP scope; standard web stack; no deep-tech risk.', whyItMatters: 'Low technical risk means faster time-to-market.' },
          { id: 'validation', name: 'Validation Path', score: 7, explanation: 'Can pilot with 2-3 banks in 90 days; clear success metric (audit prep time).', whyItMatters: 'Fast validation loop reduces capital at risk.' },
          { id: 'economics', name: 'Unit Economics', score: 7, explanation: 'High ACV ($80-150k), low marginal cost; LTV/CAC looks strong.', whyItMatters: 'Healthy margins fund growth without excessive dilution.' },
        ],
        average: 7.3,
        recommendation: 'Strong studio candidate. Clear build path, defined ICP, and attractive unit economics.',
      },
      compositeSignal: 'Advance',
    },

    // ── ICP ──────────────────────────────────────────────────
    icpDocument: {
      industry: 'Financial services (banks, insurers)',
      industrySegments: [
        { segment: 'Mid-market banks (500\u20132000 employees)', rationale: 'Regulated, compliance-heavy, budget for tools.' },
        { segment: 'Regional insurers', rationale: 'Similar compliance burden, slower to adopt than banks.' },
      ],
      companySize: '500\u20135000 employees',
      buyerRole: 'Chief Compliance Officer / Head of Risk',
      decisionMakingUnit: 'Compliance, Risk, Internal Audit',
      buyingTrigger: 'Failed audit or regulatory finding; new regulation (e.g. DORA).',
      painPoints: [
        { pain: 'Manual attestation and evidence collection', severity: 'High' as const, evidence: 'Spreadsheets and email chains break during audits.' },
        { pain: 'Audit prep takes weeks', severity: 'High' as const, evidence: 'Teams scramble to pull evidence at the last minute.' },
      ],
      currentAlternatives: 'Spreadsheets, shared drives, point solutions that don\u2019t talk to the GRC stack.',
      willingnessToPay: 'Pilot: \u00a320\u201340k/year; full rollout: \u00a380\u2013150k/year for mid-market.',
      generatedAt: now,
      source: 'AI_SYNTHESIS',
    },

    // ── Competitors ──────────────────────────────────────────
    competitorAnalysis: {
      competitors: [
        {
          id: crypto.randomUUID(),
          name: 'Vanta',
          category: 'Direct',
          description: 'Compliance automation and continuous monitoring, strong in tech/SaaS.',
          valueProposition: 'Automate compliance for SOC 2, ISO, etc.',
          targetIcp: 'Tech companies, startups.',
          pricingModel: 'Subscription.',
          fundingScale: 'Well funded.',
          keyStrengths: 'Brand, product breadth.',
          keyWeaknesses: 'Less focus on financial services and audit prep.',
          threatLevel: 'Medium',
          threatRationale: 'Could expand into FS audit prep.',
          ourDifferentiation: 'We focus on FS and audit-ready evidence, not just certification.',
          status: 'accepted',
          source: 'AI_RESEARCH',
        },
        {
          id: crypto.randomUUID(),
          name: 'OneTrust',
          category: 'Adjacent',
          description: 'Privacy and GRC platform, enterprise focus.',
          targetIcp: 'Large enterprises.',
          pricingModel: 'Enterprise licensing.',
          fundingScale: 'Unicorn.',
          keyStrengths: 'Scale, breadth.',
          keyWeaknesses: 'Complex, expensive; mid-market often overserved.',
          threatLevel: 'Low',
          threatRationale: 'They focus on large enterprises.',
          ourDifferentiation: 'Mid-market native, audit prep and attestation out of the box.',
          status: 'accepted',
          source: 'AI_RESEARCH',
        },
      ],
      landscapeSummary: 'The compliance automation market is dominated by enterprise-focused players (OneTrust, ServiceNow GRC) and tech-sector automation (Vanta, Drata). Mid-market financial services is under-served: existing tools are either too expensive or not tailored to FS-specific audit prep workflows.',
      generatedAt: now,
    },

    // ── Pressure Tests ───────────────────────────────────────
    pressureTests: [
      {
        personaId: 'skeptical_vc',
        personaName: 'The Skeptical VC',
        messages: [
          { role: 'user', content: 'Why won\u2019t the big GRC vendors just add this in the next release?', timestamp: now },
          { role: 'assistant', content: 'They could, but their roadmap is enterprise-first. Mid-market audit prep is a different workflow \u2014 we\u2019re building for that use case specifically. Their sales motion doesn\u2019t work at \u00a380k ACV.', timestamp: now },
          { role: 'user', content: 'What\u2019s your path to $10M ARR?', timestamp: now },
          { role: 'assistant', content: 'Land 3 design partners in 6 months, convert to paid. Each mid-market bank is \u00a380\u2013150k/year. 80 customers at \u00a3125k average = \u00a310M. The FS mid-market has 2,000+ banks in our geography alone.', timestamp: now },
        ],
        startedAt: now,
      },
    ],

    // ── Saved Insights ───────────────────────────────────────
    savedInsights: [
      {
        id: crypto.randomUUID(),
        personaId: 'design_partner',
        personaName: 'The Demanding Design Partner',
        content: 'You need a clear 90-day success metric. "Fewer audit findings" is too vague. Propose something like "evidence collected in half the time" or "one-click audit pack."',
        founderResponse: 'We\u2019ll define a 90-day success metric with the first design partner.',
        savedAt: now,
      },
      {
        id: crypto.randomUUID(),
        personaId: 'skeptical_vc',
        personaName: 'The Skeptical VC',
        content: 'Your differentiation is workflow, not technology. That means speed to market matters more than patent protection. Ship fast, lock in integrations.',
        savedAt: now,
      },
    ],

    // ── Client List ──────────────────────────────────────────
    clientList: {
      entries: [
        {
          id: crypto.randomUUID(),
          companyName: 'Metro Regional Bank',
          industry: 'Banking',
          companySize: '800 employees',
          rationale: 'Recently flagged in OCC exam for audit gaps; actively looking for compliance tooling.',
          contactRole: 'Chief Compliance Officer',
          status: 'contacted',
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          companyName: 'Horizon Insurance Group',
          industry: 'Insurance',
          companySize: '1200 employees',
          rationale: 'Preparing for DORA compliance; current process is manual spreadsheets.',
          contactRole: 'Head of Risk',
          status: 'candidate',
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          companyName: 'Commonwealth Credit Union',
          industry: 'Credit Union',
          companySize: '600 employees',
          rationale: 'Failed NCUA exam last quarter; board mandated compliance overhaul.',
          contactRole: 'VP of Compliance',
          status: 'qualified',
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          companyName: 'Bridgewater Mutual',
          industry: 'Insurance',
          companySize: '2000 employees',
          rationale: 'Growing compliance team signals budget and urgency for tooling.',
          contactRole: 'Director of Internal Audit',
          status: 'candidate',
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
      ],
      generatedAt: now,
    },

    // ── Financial Models ─────────────────────────────────────
    financialModels: {
      mvpCost: {
        mvpFeatures: [
          { feature: 'Policy attestation dashboard', description: 'Central view for tracking policy sign-offs across the organisation.' },
          { feature: 'Evidence collection engine', description: 'Automated evidence gathering from connected systems (email, SharePoint, GRC).' },
          { feature: 'Audit-ready report generator', description: 'One-click export of audit packs formatted for common regulatory frameworks.' },
          { feature: 'GRC API integration layer', description: 'REST/webhook connectors to OneTrust, ServiceNow, and Archer.' },
          { feature: 'Role-based access control', description: 'Granular permissions for compliance, audit, and management roles.' },
        ],
        scenarios: { conservative: 320000, base: 240000, aggressive: 180000 },
        lineItems: [
          { category: 'Engineering (3 devs, 6 months)', conservative: 210000, base: 160000, aggressive: 120000 },
          { category: 'Design & UX', conservative: 40000, base: 30000, aggressive: 25000 },
          { category: 'Infrastructure & hosting', conservative: 25000, base: 18000, aggressive: 12000 },
          { category: 'Security audit & pen test', conservative: 20000, base: 15000, aggressive: 10000 },
          { category: 'Legal & compliance (own)', conservative: 15000, base: 10000, aggressive: 8000 },
          { category: 'Contingency', conservative: 10000, base: 7000, aggressive: 5000 },
        ],
        assumptions: [
          { id: 'dev-rate', label: 'Average developer cost (annual)', value: 110000, source: 'AI_RESEARCH', confidence: 'Medium' as const, note: 'UK market rate for senior full-stack engineers.', updatedAt: now },
          { id: 'timeline', label: 'MVP build timeline', value: '6 months', source: 'FOUNDER', confidence: 'Medium' as const, updatedAt: now },
        ],
        generatedAt: now,
      },
      unitEconomics: {
        inputs: {
          acv: { value: 100000 },
          cac: { value: 25000 },
          grossMargin: { value: 0.82 },
          monthlyChurn: { value: 0.015 },
          expansionRate: { value: 0.03 },
        },
        outputs: {
          ltv: 546667,
          ltvCac: 21.9,
          paybackMonths: 3,
          ruleOf40: 54,
        },
        assumptions: [
          { id: 'acv-source', label: 'Average contract value', value: 100000, source: 'FOUNDER', confidence: 'Medium' as const, note: 'Based on target \u00a380\u2013150k range, weighted toward mid-market.', updatedAt: now },
          { id: 'cac-source', label: 'Customer acquisition cost', value: 25000, source: 'AI_SYNTHESIS', confidence: 'Low' as const, note: 'Enterprise SaaS benchmark; actual will vary with sales motion.', updatedAt: now },
        ],
        generatedAt: now,
      },
      marketSizing: {
        tam: 12400000000,
        sam: 1500000000,
        som: 45000000,
        methodology: 'Top-down: Global GRC software market ($12.4B, Gartner 2025) narrowed to mid-market financial services compliance automation (~$1.5B SAM). SOM based on capturing 3% of SAM in first 3 years across UK and US mid-market banks and insurers.',
        assumptions: [
          { id: 'tam-source', label: 'Global GRC software market', value: 12400000000, source: 'AI_RESEARCH', confidence: 'High' as const, citation: { title: 'Gartner GRC Market Forecast 2025', url: 'https://www.gartner.com/en/documents/grc-market-2025' }, updatedAt: now },
          { id: 'sam-pct', label: 'Mid-market FS share of TAM', value: '12%', source: 'AI_SYNTHESIS', confidence: 'Medium' as const, updatedAt: now },
        ],
        generatedAt: now,
      },
    },

    // ── Strategy & Moat ──────────────────────────────────────
    strategyMoat: {
      assessment: {
        recommendedMoats: [
          {
            type: 'Workflow Integration',
            rationale: 'Deep integration with existing GRC tools (ServiceNow, Archer, OneTrust) creates high switching costs. Once audit workflows are built on your connectors, rip-and-replace is painful.',
            examples: ['Plaid for banking APIs', 'Workato for enterprise integration'],
          },
          {
            type: 'Data Network Effect',
            rationale: 'As more banks use the platform, you accumulate anonymised compliance benchmarks (audit pass rates, common findings, time-to-evidence). This data becomes a moat: new customers get better baseline benchmarks.',
            examples: ['Vanta compliance benchmarks', 'Carta equity benchmarks'],
          },
        ],
        currentClaims: [
          { moatType: 'Domain Expertise', claim: 'Deep understanding of FS audit workflows', supported: true },
          { moatType: 'Proprietary Technology', claim: 'AI-powered evidence extraction', supported: false },
        ],
        narrative: 'Your near-term moat is workflow integration depth \u2014 making your platform the connective tissue between GRC tools and auditors. Long-term, the data network effect compounds as you onboard more institutions. Proprietary tech claims are premature until the AI evidence-extraction engine is validated.',
        generatedAt: now,
      },
      sessions: [
        {
          personaId: 'strategy_advisor',
          personaName: 'Strategy Advisor',
          messages: [
            { role: 'user', content: 'How should we think about defensibility against Vanta moving into financial services?', timestamp: now },
            { role: 'assistant', content: 'Vanta\u2019s strength is breadth across SOC 2/ISO for tech companies. FS audit prep requires deep regulatory knowledge (OCC, PRA, DORA) and integration with legacy GRC stacks that Vanta hasn\u2019t built for. Your best defence is speed: lock in 10+ FS customers with custom workflows before Vanta pivots. Switching costs compound with each integration.', timestamp: now },
          ],
          startedAt: now,
        },
      ],
      founderNotes: 'Prioritise GRC API integrations in the MVP \u2014 this is where switching costs live.',
    },

    // ── Discover Research ────────────────────────────────────
    discover: {
      research: [
        {
          id: crypto.randomUUID(),
          type: 'vc_thesis',
          query: 'VC investment thesis for compliance automation in financial services',
          content: 'The compliance automation market is attracting significant VC interest, driven by the increasing regulatory burden on financial institutions post-2008. Key investment themes include: (1) Automation of manual compliance workflows, where mid-market firms spend 15-25% of compliance budgets on manual audit prep. (2) RegTech convergence, as point solutions give way to integrated platforms. (3) AI-driven evidence extraction and anomaly detection, enabling continuous compliance rather than point-in-time audits. Notable recent deals include Vanta ($150M Series C), Drata ($200M Series C), and Anecdotes ($55M Series B). Investors are particularly interested in vertical-specific solutions for regulated industries where compliance costs are highest.',
          citations: [
            { title: 'Vanta raises $150M for compliance automation', url: 'https://techcrunch.com/2023/vanta-series-c' },
            { title: 'RegTech Market Forecast 2025-2030', url: 'https://www.grandviewresearch.com/regtech-market' },
          ],
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          type: 'market_signal',
          query: 'Market signals for compliance SaaS in mid-market banking',
          content: 'Several converging signals point to strong demand for mid-market compliance tooling. The EU Digital Operational Resilience Act (DORA) takes effect January 2025, requiring all financial entities to demonstrate operational resilience and ICT risk management. In the US, OCC enforcement actions against mid-sized banks rose 23% in 2024, with audit documentation gaps cited in 40% of cases. Meanwhile, mid-market banks report compliance staff turnover of 18% annually, making institutional knowledge loss a critical pain point. The shift from periodic to continuous compliance monitoring is creating a wedge for new entrants that can offer real-time attestation dashboards.',
          citations: [
            { title: 'DORA Regulation Overview - European Commission', url: 'https://ec.europa.eu/finance/dora' },
            { title: 'OCC Annual Report 2024 Enforcement Trends', url: 'https://www.occ.gov/annual-report-2024' },
          ],
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
      ],
    },
  }
}

/**
 * Returns a partial Venture payload for the "Rillet" demo venture.
 * Populates every screen in Define (02) and Incubate (03) using real
 * publicly-available information about Rillet (AI-native ERP).
 */
export function getRilletVenturePayload(): Partial<Venture> {
  const now = new Date().toISOString()

  const interviewId1 = crypto.randomUUID()
  const interviewId2 = crypto.randomUUID()

  return {
    name: makeTrackedField('Rillet', 'VL'),
    stage: makeTrackedField('04', 'VL'),
    founder: makeTrackedField('Nicolas Kopp', 'VL'),
    status: makeTrackedField('On Track', 'VL'),
    description: makeTrackedField(
      'AI-native ERP platform replacing legacy accounting software. Founded by Nicolas Kopp (ex-N26 US CEO) and Stelios Modes (ex-ThoughtWorks). Perpetual general ledger, Aura AI co-pilot, revenue recognition, multi-entity consolidation.',
      'VL'
    ),

    // ── Idea Intake ──────────────────────────────────────────
    ideaIntake: {
      messages: [
        {
          role: 'user',
          content: 'We are building an AI-native ERP platform that replaces legacy accounting software like NetSuite and Sage Intacct. The core pain is that finance teams spend 30-40% of their time on manual reconciliation, close processes, and fighting their own tools. Our platform starts with a perpetual general ledger and layers AI on top — our Aura co-pilot automates journal entries, reconciliation, and anomaly detection in real time.',
          source: 'FOUNDER',
          timestamp: now,
        },
        {
          role: 'assistant',
          content: "That's a bold thesis — going after the ERP incumbents is a massive market but a hard problem. Who is the buyer? Are you targeting the CFO or the controller?",
          source: 'VERA',
          timestamp: now,
        },
        {
          role: 'user',
          content: 'The buyer is the VP Finance or Controller at high-growth companies with 100-2000 employees. They\'ve outgrown QuickBooks but find NetSuite too rigid and expensive. We\'re not replacing the full ERP stack on day one — we start with the general ledger and expand into revenue recognition, AP/AR, and multi-entity consolidation. Our first customers include Postscript, Windsurf, and Sotheby\'s.',
          source: 'FOUNDER',
          timestamp: now,
        },
        {
          role: 'assistant',
          content: 'Interesting wedge. What makes you uniquely qualified to tackle this?',
          source: 'VERA',
          timestamp: now,
        },
        {
          role: 'user',
          content: 'I\'m Nicolas Kopp, former US CEO of N26 — I dealt with legacy finance systems at scale. My co-founder Stelios Modes comes from ThoughtWorks and has deep enterprise software experience. We\'ve raised $100M+ total including a $70M Series B led by a16z and ICONIQ Growth. We now process over 100 million transactions per day across 200+ customers.',
          source: 'FOUNDER',
          timestamp: now,
        },
      ],
      dimensionCoverage: [
        { id: '01', status: 'complete', summary: 'Core concept: AI-native ERP replacing legacy accounting with perpetual GL and Aura AI co-pilot.', flags: [] },
        { id: '02', status: 'complete', summary: 'Pain: finance teams spend 30-40% of time on manual reconciliation and fighting legacy tools.', flags: [] },
        { id: '03', status: 'complete', summary: 'ICP: VP Finance / Controller at high-growth companies (100-2000 employees) outgrowing QuickBooks.', flags: [] },
        { id: '04', status: 'complete', summary: 'Solution: perpetual general ledger with AI co-pilot (Aura), revenue recognition, multi-entity consolidation.', flags: [] },
        { id: '05', status: 'complete', summary: 'Revenue: SaaS subscription model scaled by entity count and transaction volume.', flags: [] },
        { id: '06', status: 'complete', summary: 'Market: $50B+ cloud ERP market; mid-market accounting segment growing 15%+ CAGR.', flags: [] },
        { id: '07', status: 'complete', summary: 'Team: Nicolas Kopp (ex-N26 US CEO), Stelios Modes (ex-ThoughtWorks). $100M+ raised.', flags: [] },
        { id: '08', status: 'complete', summary: 'Traction: 200+ customers, 400+ finance teams, 100M+ transactions/day.', flags: [] },
        { id: '09', status: 'in_progress', summary: 'GTM: product-led onboarding with sales-assist for upmarket deals.', flags: [] },
        { id: '10', status: 'in_progress', summary: 'Risks: incumbent lock-in, data migration friction, regulatory compliance.', flags: [] },
      ],
      completed: true,
    },

    // ── Scoring ──────────────────────────────────────────────
    scoring: {
      corporate: {
        dimensions: [
          { id: 'market', name: 'Market Opportunity', score: 9, explanation: 'Cloud ERP market exceeds $50B. Mid-market segment is under-served by modern, AI-native alternatives.', whyItMatters: 'A large, growing TAM with weak incumbents signals a generational opportunity.' },
          { id: 'team', name: 'Team Fit', score: 9, explanation: 'CEO ran a $3.6B neobank in the US; CTO built enterprise-grade systems at ThoughtWorks.', whyItMatters: 'Founder-market fit is exceptional — they\'ve lived the problem at scale.' },
          { id: 'defensibility', name: 'Defensibility', score: 8, explanation: 'Perpetual ledger architecture is a structural moat — competitors would need to rebuild from scratch. Data gravity increases with usage.', whyItMatters: 'Architectural defensibility compounds over time and resists fast-follow.' },
        ],
        average: 8.7,
        recommendation: 'Exceptional corporate innovation candidate. Rare combination of massive market, proven founders, and a defensible technical architecture.',
      },
      vc: {
        dimensions: [
          { id: 'market', name: 'Market Size', score: 9, explanation: 'TAM of $50B+ in cloud ERP/accounting. SAM of $8B for mid-market AI-native accounting.', whyItMatters: 'Venture-scale TAM supports a multi-billion-dollar outcome.' },
          { id: 'traction', name: 'Traction', score: 9, explanation: '200+ customers, 100M+ daily transactions, $70M Series B from a16z + ICONIQ.', whyItMatters: 'Post-PMF with blue-chip investors — de-risked relative to stage.' },
          { id: 'scalability', name: 'Scalability', score: 8, explanation: 'SaaS model with per-entity pricing scales efficiently. AI automation reduces implementation overhead vs legacy ERP.', whyItMatters: 'Better unit economics than legacy ERP vendors enable faster compounding.' },
        ],
        average: 8.7,
        recommendation: 'Top-tier VC profile. Proven traction, massive market, and a well-capitalised team on a clear path to $100M+ ARR.',
      },
      studio: {
        dimensions: [
          { id: 'buildability', name: 'Buildability', score: 7, explanation: 'ERP is inherently complex — but the team has already shipped and scaled the product.', whyItMatters: 'Execution risk is low given the team\'s track record and existing product.' },
          { id: 'validation', name: 'Validation Path', score: 9, explanation: 'Already validated with 200+ paying customers. Clear expansion into rev rec and multi-entity.', whyItMatters: 'Post-validation stage — the question is scale, not fit.' },
          { id: 'economics', name: 'Unit Economics', score: 8, explanation: 'High ACV ($50-200K+), strong gross margins (80%+), low churn given system-of-record stickiness.', whyItMatters: 'Favourable unit economics support efficient growth.' },
        ],
        average: 8.0,
        recommendation: 'Strong studio profile despite ERP complexity. Team has already de-risked execution. Focus on multi-product expansion.',
      },
      compositeSignal: 'Advance',
    },

    // ── ICP ──────────────────────────────────────────────────
    icpDocument: {
      industry: 'Cross-industry (SaaS, e-commerce, marketplaces, professional services)',
      industrySegments: [
        { segment: 'High-growth SaaS companies (100-2000 employees)', rationale: 'Complex revenue recognition needs; outgrowing QuickBooks/Xero.' },
        { segment: 'E-commerce and marketplaces', rationale: 'High transaction volume makes legacy batch-close painful.' },
        { segment: 'Professional services firms', rationale: 'Multi-entity consolidation is a major pain point.' },
      ],
      companySize: '100-2000 employees',
      buyerRole: 'VP Finance / Controller / CFO',
      decisionMakingUnit: 'Finance, Accounting, FP&A',
      buyingTrigger: 'Outgrowing QuickBooks; frustrated with NetSuite implementation cost and rigidity; preparing for audit or IPO.',
      painPoints: [
        { pain: 'Manual month-end close takes 10-15 days', severity: 'High' as const, evidence: 'Finance teams spend 30-40% of time on reconciliation and close workflows.' },
        { pain: 'Legacy ERP is rigid and expensive to customise', severity: 'High' as const, evidence: 'NetSuite implementations cost $200K+ and take 6+ months.' },
        { pain: 'No real-time visibility into financial data', severity: 'Medium' as const, evidence: 'Batch-based systems mean data is always stale; anomalies caught late.' },
      ],
      currentAlternatives: 'NetSuite (Oracle), Sage Intacct, QuickBooks Enterprise, Microsoft Dynamics.',
      willingnessToPay: 'Base: $50-100K/year; enterprise: $150-300K/year for multi-entity with AI modules.',
      generatedAt: now,
      source: 'AI_SYNTHESIS',
    },

    // ── Competitors ──────────────────────────────────────────
    competitorAnalysis: {
      competitors: [
        {
          id: crypto.randomUUID(),
          name: 'NetSuite (Oracle)',
          category: 'Direct',
          description: 'Cloud ERP market leader. Broad suite covering GL, AP/AR, inventory, CRM.',
          valueProposition: 'Unified cloud ERP for mid-market and enterprise.',
          targetIcp: 'Mid-market to large enterprise, all industries.',
          pricingModel: 'Per-user subscription + module add-ons. Typically $50-200K+/year.',
          fundingScale: 'Public (Oracle subsidiary).',
          keyStrengths: 'Market share, broad functionality, established ecosystem of implementation partners.',
          keyWeaknesses: 'Rigid architecture, expensive customisation, slow innovation, poor UX.',
          threatLevel: 'Medium',
          threatRationale: 'Dominant market share but architectural rigidity limits their ability to deliver AI-native capabilities.',
          ourDifferentiation: 'Perpetual ledger replaces batch close; Aura AI co-pilot automates reconciliation; 10x faster implementation.',
          status: 'accepted',
          source: 'AI_RESEARCH',
        },
        {
          id: crypto.randomUUID(),
          name: 'Sage Intacct',
          category: 'Direct',
          description: 'Cloud accounting for mid-market. Strong in multi-entity and non-profit.',
          targetIcp: 'Mid-market businesses, non-profits.',
          pricingModel: 'Subscription-based, modular pricing.',
          fundingScale: 'Public (Sage Group subsidiary).',
          keyStrengths: 'Multi-entity consolidation, AICPA-preferred, strong in services sector.',
          keyWeaknesses: 'Limited AI capabilities, dated UX, slower product velocity.',
          threatLevel: 'Medium',
          threatRationale: 'Strong in our target market but lacks the technical architecture for real-time AI.',
          ourDifferentiation: 'AI-native from ground up; real-time perpetual ledger vs batch; modern developer experience.',
          status: 'accepted',
          source: 'AI_RESEARCH',
        },
        {
          id: crypto.randomUUID(),
          name: 'Puzzle',
          category: 'Direct',
          description: 'AI-first accounting platform targeting startups. YC-backed.',
          targetIcp: 'Startups and early-stage companies.',
          pricingModel: 'SaaS subscription.',
          fundingScale: 'Series A ($27M raised).',
          keyStrengths: 'Modern UX, AI categorisation, startup-friendly.',
          keyWeaknesses: 'Limited to smaller companies; no multi-entity; less mature product.',
          threatLevel: 'Low',
          threatRationale: 'Competing for mindshare in AI accounting but targeting a smaller segment.',
          ourDifferentiation: 'Enterprise-grade architecture handles 100M+ transactions/day; multi-entity; revenue recognition.',
          status: 'accepted',
          source: 'AI_RESEARCH',
        },
      ],
      landscapeSummary: 'The mid-market accounting/ERP space is dominated by legacy players (NetSuite, Sage Intacct) built on batch-processing architectures from the 2000s. New AI-first entrants (Puzzle, Ledge) target smaller companies. Rillet occupies a unique position: enterprise-grade scale with AI-native architecture, targeting the high-growth mid-market that is both under-served and high-value.',
      generatedAt: now,
    },

    // ── Pressure Tests ───────────────────────────────────────
    pressureTests: [
      {
        personaId: 'skeptical_vc',
        personaName: 'The Skeptical VC',
        messages: [
          { role: 'user', content: 'ERP is a graveyard for startups. Why will Rillet succeed where others failed?', timestamp: now },
          { role: 'assistant', content: 'Fair challenge. Three things are different now: (1) AI has crossed the capability threshold for automating accounting judgement calls — this wasn\'t possible even 3 years ago. (2) The architectural foundation matters — our perpetual ledger eliminates batch close entirely, which legacy vendors can\'t retrofit. (3) Timing — there are 50,000+ companies in our ICP that have outgrown QuickBooks but refuse to endure a 6-month NetSuite implementation. We\'re already at 200+ customers and 100M+ transactions/day, which proves the market pull.', timestamp: now },
          { role: 'user', content: 'Oracle has unlimited resources. What stops them from building an AI layer on NetSuite?', timestamp: now },
          { role: 'assistant', content: 'They could add AI features on top, but their batch-based ledger architecture is the bottleneck. You can\'t do real-time anomaly detection or continuous close on a system that reconciles overnight. It would require a ground-up rebuild of NetSuite\'s core — that\'s a multi-year, multi-hundred-million dollar project that would disrupt their existing $2B+ NetSuite revenue. Classic innovator\'s dilemma.', timestamp: now },
        ],
        startedAt: now,
      },
      {
        personaId: 'demanding_cfo',
        personaName: 'The Demanding Design Partner',
        messages: [
          { role: 'user', content: 'How do you handle the data migration from NetSuite? That\'s always the dealbreaker.', timestamp: now },
          { role: 'assistant', content: 'We\'ve built automated migration tooling that ingests a full NetSuite chart of accounts, historical transactions, and custom fields. Typical migration takes 2-4 weeks vs 4-6 months for a NetSuite implementation. The perpetual ledger architecture helps here — we import historical data and it immediately becomes queryable in real time. We\'ve done this successfully for customers like Postscript and Windsurf.', timestamp: now },
        ],
        startedAt: now,
      },
    ],

    // ── Saved Insights ───────────────────────────────────────
    savedInsights: [
      {
        id: crypto.randomUUID(),
        personaId: 'skeptical_vc',
        personaName: 'The Skeptical VC',
        content: 'The perpetual ledger architecture is the real moat — it\'s not just a feature, it\'s a fundamentally different data model that enables real-time AI. Legacy vendors can\'t retrofit this without rebuilding from scratch.',
        savedAt: now,
      },
      {
        id: crypto.randomUUID(),
        personaId: 'demanding_cfo',
        personaName: 'The Demanding Design Partner',
        content: 'Data migration is the #1 objection in ERP sales. Rillet\'s 2-4 week migration vs 6-month NetSuite implementation is a genuine competitive advantage that should be front and centre in GTM messaging.',
        founderResponse: 'Agreed — we\'re building this into our sales deck as the opening wedge.',
        savedAt: now,
      },
    ],

    // ── Business Brief ───────────────────────────────────────
    businessBrief: {
      content: {
        opportunityOverview: 'Rillet is building an AI-native ERP platform that replaces legacy accounting software (NetSuite, Sage Intacct) for high-growth companies. The core innovation is a perpetual general ledger that eliminates batch-based month-end close, combined with Aura, an AI co-pilot that automates reconciliation, journal entries, and anomaly detection. Founded in 2021 by Nicolas Kopp (ex-N26 US CEO) and Stelios Modes (ex-ThoughtWorks), Rillet has raised $100M+ including a $70M Series B led by a16z and ICONIQ Growth.',
        problemAndPainPoints: 'Finance teams at companies with 100-2000 employees face a painful gap: QuickBooks is too basic, but NetSuite is too rigid and expensive. Month-end close takes 10-15 business days. Finance teams spend 30-40% of their time on manual reconciliation. NetSuite implementations cost $200K+ and take 6+ months. Legacy batch-based systems provide no real-time financial visibility, meaning anomalies and errors are caught days or weeks late.',
        idealCustomerProfile: 'VP Finance or Controller at high-growth companies (100-2000 employees) in SaaS, e-commerce, marketplaces, and professional services. The trigger is outgrowing QuickBooks or frustration with a NetSuite implementation. Current customers include Postscript (SMS marketing), Windsurf (AI coding), and Sotheby\'s (luxury marketplace).',
        solutionOverview: 'Rillet starts with a perpetual general ledger — transactions are continuously reconciled rather than batch-processed. Aura AI co-pilot automates journal entries, reconciliation, and anomaly detection. Revenue recognition (ASC 606) is built-in. Multi-entity consolidation supports complex corporate structures. The platform processes 100M+ transactions per day across 200+ customers and 400+ finance teams.',
        marketAnalysis: 'The global cloud ERP market exceeds $50B and is growing at 15%+ CAGR. The mid-market accounting segment ($8B SAM) is dominated by legacy players with aging architecture. New entrants like Puzzle target smaller companies but lack enterprise scale. Rillet is uniquely positioned: AI-native architecture with enterprise-grade reliability, targeting the underserved high-growth mid-market.',
        recommendations: 'Strong advance signal. Rillet has exceptional founder-market fit, proven traction (200+ customers, $70M Series B from top-tier VCs), and a defensible technical architecture. Key risks include the inherent complexity of ERP replacement and competition from Oracle/Sage\'s inevitable AI initiatives. Recommended next steps: monitor multi-product expansion into AP/AR and FP&A, and assess retention metrics at the 18-month mark.',
      },
      citationIds: [],
      generatedAt: now,
      version: 1,
    },

    // ── Financial Models ─────────────────────────────────────
    financialModels: {
      mvpCost: {
        mvpFeatures: [
          { feature: 'Perpetual general ledger', description: 'Continuous real-time ledger replacing batch-based close. Core architectural differentiator.' },
          { feature: 'Aura AI co-pilot', description: 'AI engine for automated journal entries, reconciliation, and anomaly detection.' },
          { feature: 'Revenue recognition (ASC 606)', description: 'Automated revenue recognition compliant with ASC 606 standards.' },
          { feature: 'Multi-entity consolidation', description: 'Real-time consolidation across subsidiaries and entities.' },
          { feature: 'Migration tooling', description: 'Automated import from NetSuite, Sage Intacct, and QuickBooks.' },
        ],
        scenarios: { conservative: 8500000, base: 6000000, aggressive: 4500000 },
        lineItems: [
          { category: 'Engineering (25 engineers, 12 months)', conservative: 6000000, base: 4200000, aggressive: 3200000 },
          { category: 'AI/ML infrastructure', conservative: 1000000, base: 750000, aggressive: 550000 },
          { category: 'Cloud infrastructure (AWS/GCP)', conservative: 600000, base: 450000, aggressive: 300000 },
          { category: 'Security & SOC 2 compliance', conservative: 400000, base: 300000, aggressive: 200000 },
          { category: 'Design & UX', conservative: 300000, base: 200000, aggressive: 150000 },
          { category: 'Contingency', conservative: 200000, base: 100000, aggressive: 100000 },
        ],
        assumptions: [
          { id: 'eng-cost', label: 'Average senior engineer cost (fully loaded)', value: 250000, source: 'AI_RESEARCH', confidence: 'Medium' as const, note: 'Bay Area market rate for senior full-stack and infra engineers.', updatedAt: now },
          { id: 'timeline', label: 'MVP build timeline', value: '12 months', source: 'FOUNDER', confidence: 'High' as const, note: 'Actual timeline to first paying customer.', updatedAt: now },
        ],
        generatedAt: now,
      },
      unitEconomics: {
        inputs: {
          acv: { value: 120000 },
          cac: { value: 30000 },
          grossMargin: { value: 0.82 },
          monthlyChurn: { value: 0.008 },
          expansionRate: { value: 0.04 },
        },
        outputs: {
          ltv: 2460000,
          ltvCac: 82.0,
          paybackMonths: 3,
          ruleOf40: 68,
        },
        assumptions: [
          { id: 'acv-source', label: 'Average contract value', value: 120000, source: 'AI_SYNTHESIS', confidence: 'Medium' as const, note: 'Based on $50-300K range, weighted toward mid-market.', updatedAt: now },
          { id: 'churn-source', label: 'Monthly churn rate', value: 0.008, source: 'AI_SYNTHESIS', confidence: 'Medium' as const, note: 'System-of-record stickiness drives low churn; ERP replacement cost is high.', updatedAt: now },
        ],
        generatedAt: now,
      },
      marketSizing: {
        tam: 50000000000,
        sam: 8000000000,
        som: 240000000,
        methodology: 'Top-down: Global cloud ERP market ($50B, Gartner 2025) narrowed to mid-market AI-native accounting/GL segment (~$8B SAM). SOM based on capturing 3% of SAM in 3-5 years, targeting high-growth companies in SaaS, e-commerce, and professional services across US and Europe.',
        assumptions: [
          { id: 'tam-source', label: 'Global cloud ERP market', value: 50000000000, source: 'AI_RESEARCH', confidence: 'High' as const, citation: { title: 'Gartner Cloud ERP Market Forecast 2025', url: 'https://www.gartner.com/en/documents/cloud-erp-2025' }, updatedAt: now },
          { id: 'sam-pct', label: 'Mid-market AI accounting share of TAM', value: '16%', source: 'AI_SYNTHESIS', confidence: 'Medium' as const, updatedAt: now },
        ],
        generatedAt: now,
      },
    },

    // ── Interviews ───────────────────────────────────────────
    interviews: {
      uploads: [
        {
          id: interviewId1,
          transcript: `Interviewer: Tell me about your experience with month-end close before Rillet.\n\nVP Finance, Postscript: It was brutal. We were on NetSuite and our close took 12-14 business days. My team of three was basically locked in a room for two weeks every month doing reconciliation. The worst part was finding errors — you'd discover a misclassified transaction on day 10 and have to unwind a week of work.\n\nInterviewer: What changed after switching to Rillet?\n\nVP Finance, Postscript: Night and day. The perpetual ledger means we're always reconciled. Aura catches anomalies the same day they happen. Our close is now 3 days. My team actually works on analysis now instead of data entry.\n\nInterviewer: What was the migration like?\n\nVP Finance, Postscript: Honestly, that was my biggest concern. We had 4 years of data in NetSuite. Rillet's migration tool ingested everything in about 3 weeks. There were some chart-of-accounts mapping issues but the Rillet team was responsive. Compare that to our original NetSuite implementation which took 5 months.\n\nInterviewer: Would you go back?\n\nVP Finance, Postscript: Not a chance. I've told three other VPs of Finance about Rillet. The real-time visibility alone is worth it — I can pull a P&L any time and know it's accurate.`,
          intervieweeRole: 'Client',
          intervieweeCompany: 'Postscript',
          interviewDate: now,
          conductedBy: 'Venture Lead',
          interviewType: 'Customer validation',
          uploadedBy: 'VL',
          uploadedAt: now,
        },
        {
          id: interviewId2,
          transcript: `Interviewer: What made you invest in Rillet for the Series B?\n\nPartner, a16z: Three things. First, the architecture. Most "AI accounting" startups are putting a chatbot on top of the same batch-based ledger. Rillet built a fundamentally different data model — the perpetual ledger. That's a real technical moat.\n\nSecond, the founders. Nicolas ran N26 US — he understands fintech ops at scale. Stelios is a systems architect. You rarely see that combination.\n\nThird, the numbers. 200+ customers, 100M+ transactions per day, net revenue retention above 130%. When your ERP customers expand that fast, you know the product works.\n\nInterviewer: What risks do you see?\n\nPartner, a16z: ERP replacement cycles are long. The average sales cycle is 3-6 months. And Oracle/Sage won't sit still — they'll bolt on AI features. But I think Rillet has a 3-5 year window where their architecture gives them a genuine advantage. The question is whether they can get to $200M ARR before the incumbents catch up.\n\nInterviewer: How do you think about the competitive landscape?\n\nPartner, a16z: Puzzle and others are going after small companies. Microsoft is too enterprise. NetSuite is too rigid. The mid-market, high-growth segment — that's Rillet's to lose.`,
          intervieweeRole: 'VC',
          intervieweeCompany: 'a16z',
          interviewDate: now,
          conductedBy: 'Venture Lead',
          interviewType: 'Investor perspective',
          uploadedBy: 'VL',
          uploadedAt: now,
        },
      ],
      extractions: {
        [interviewId1]: {
          uploadId: interviewId1,
          painPoints: [
            { quote: 'Our close took 12-14 business days. My team of three was basically locked in a room for two weeks.', paraphrase: 'Month-end close consumes 2 weeks of a 3-person team.', validated: true },
            { quote: 'You\'d discover a misclassified transaction on day 10 and have to unwind a week of work.', paraphrase: 'Errors discovered late in batch close cascade into rework.', validated: true },
          ],
          workarounds: ['Manual reconciliation in spreadsheets alongside NetSuite', 'Dedicated "close team" locked down for 2 weeks each month'],
          willingnessToPay: ['Switched from NetSuite — implies budget of $100K+ for an alternative'],
          icpMatch: 'Strong — VP Finance at a high-growth SaaS company (Postscript) with 100+ employees, previously on NetSuite.',
          featureRequests: ['Real-time P&L access', 'Automated anomaly detection'],
          objections: ['Data migration risk from legacy system'],
          keyQuotes: ['Our close is now 3 days.', 'I\'ve told three other VPs of Finance about Rillet.', 'The real-time visibility alone is worth it.'],
          signalQuality: 'Strong',
          generatedAt: now,
        },
        [interviewId2]: {
          uploadId: interviewId2,
          painPoints: [
            { quote: 'Most "AI accounting" startups are putting a chatbot on top of the same batch-based ledger.', paraphrase: 'Competitors lack true architectural innovation — cosmetic AI on legacy foundations.', validated: true },
          ],
          workarounds: [],
          willingnessToPay: ['$70M Series B investment validates significant market value'],
          icpMatch: 'N/A — investor perspective validating thesis from outside.',
          featureRequests: [],
          objections: ['ERP replacement cycles are long (3-6 months sales cycle)', 'Oracle/Sage will bolt on AI features'],
          keyQuotes: ['Net revenue retention above 130%.', 'The mid-market, high-growth segment — that\'s Rillet\'s to lose.', 'Rillet has a 3-5 year window where their architecture gives them a genuine advantage.'],
          signalQuality: 'Strong',
          generatedAt: now,
        },
      },
      synthesis: {
        themes: [
          { theme: 'Perpetual ledger as architectural moat', count: 2 },
          { theme: 'Month-end close reduction (from weeks to days)', count: 2 },
          { theme: 'Data migration as key objection and differentiator', count: 2 },
          { theme: 'Real-time financial visibility', count: 1 },
          { theme: 'Strong NRR and organic referrals', count: 2 },
        ],
        contradictions: ['Customer sees migration as manageable (3 weeks); investor flags sales cycle length (3-6 months) as risk — different scopes.'],
        topQuotes: [
          'Our close is now 3 days.',
          'Net revenue retention above 130%.',
          'The mid-market, high-growth segment — that\'s Rillet\'s to lose.',
        ],
        signalQuality: 'Strong across both customer and investor perspectives.',
        generatedAt: now,
      },
    },

    // ── Strategy & Moat ──────────────────────────────────────
    strategyMoat: {
      assessment: {
        recommendedMoats: [
          {
            type: 'Architectural Moat (Perpetual Ledger)',
            rationale: 'The perpetual general ledger is not a feature — it is a fundamentally different data model that enables real-time reconciliation, AI automation, and continuous close. Legacy vendors cannot retrofit this without rebuilding their core, which would take years and billions of dollars. This is a structural moat.',
            examples: ['Snowflake (architectural re-think of data warehousing)', 'Figma (multiplayer by design, not bolted on)'],
          },
          {
            type: 'Data Gravity',
            rationale: 'As the system of record for financial data, Rillet accumulates transaction history, chart-of-accounts mappings, and AI-trained reconciliation patterns. Each additional month of data makes the AI more accurate and switching more costly. At 100M+ transactions/day, data gravity is already significant.',
            examples: ['Plaid (transaction data network)', 'Stripe (payment data and risk models)'],
          },
          {
            type: 'Ecosystem Lock-in',
            rationale: 'ERP is deeply integrated into a company\'s tech stack — bank feeds, payroll, billing, CRM, tax. Each integration increases switching cost. Rillet\'s API-first architecture makes it easy to integrate in, hard to rip out.',
            examples: ['Salesforce (CRM ecosystem)', 'Shopify (commerce platform)'],
          },
        ],
        currentClaims: [
          { moatType: 'Technical Architecture', claim: 'Perpetual ledger eliminates batch close', supported: true },
          { moatType: 'AI Capability', claim: 'Aura AI automates journal entries and reconciliation', supported: true },
          { moatType: 'Scale', claim: '100M+ transactions per day', supported: true },
          { moatType: 'Network Effect', claim: 'Cross-company benchmarking', supported: false },
        ],
        narrative: 'Rillet\'s primary moat is architectural: the perpetual ledger is a foundational advantage that cannot be easily replicated. Data gravity is building as the transaction base grows. The ecosystem lock-in moat will strengthen as multi-product expansion (rev rec, AP/AR, FP&A) deepens integration. Network effects are aspirational — cross-company benchmarking is not yet a product feature.',
        generatedAt: now,
      },
      sessions: [
        {
          personaId: 'strategy_advisor',
          personaName: 'Strategy Advisor',
          messages: [
            { role: 'user', content: 'How should Rillet sequence its multi-product expansion?', timestamp: now },
            { role: 'assistant', content: 'Start with the modules that deepen the ledger moat: revenue recognition first (ASC 606 compliance is a must-have trigger), then multi-entity consolidation (expands ACV significantly). AP/AR comes next — it keeps more financial workflow inside Rillet. FP&A and budgeting should be last because they\'re more competitive and less differentiated by the perpetual ledger. The key insight: each module you add increases data gravity and switching cost. Prioritise modules where the perpetual ledger gives you an unfair advantage.', timestamp: now },
          ],
          startedAt: now,
        },
      ],
      founderNotes: 'Rev rec is already shipped. Multi-entity is in beta. AP/AR is next on the roadmap.',
    },

    // ── Solution Definition ──────────────────────────────────
    solutionDefinition: {
      whatItDoes: 'Rillet is an AI-native ERP platform centred on a perpetual general ledger. Unlike batch-based systems, every transaction is reconciled in real time. Aura, the AI co-pilot, automates journal entries, flags anomalies, and suggests corrections. Revenue recognition (ASC 606), multi-entity consolidation, and automated financial reporting are built-in. The platform processes 100M+ transactions per day.',
      differentiation: 'The perpetual ledger architecture is the core differentiator. Legacy ERPs (NetSuite, Sage Intacct) run on batch-processing models from the 2000s — they reconcile overnight and close monthly. Rillet\'s continuous reconciliation enables: (1) real-time AI automation that requires live data, (2) month-end close in 3 days instead of 10-15, (3) instant financial visibility without waiting for batch jobs. This architectural difference cannot be patched onto legacy systems.',
      whatItDoesNot: 'Rillet does not (yet) replace the full ERP stack: inventory management, procurement, and HR/payroll remain outside scope. It is not targeting companies with fewer than 100 employees (QuickBooks is sufficient) or enterprises with 10,000+ employees (where SAP/Oracle dominate). It does not attempt to be a banking or payments platform.',
      tenXClaim: '10x faster month-end close (3 days vs 10-15 days), 10x faster implementation (3 weeks vs 6 months), and continuous AI-driven reconciliation that eliminates manual effort entirely.',
      evidence: [
        'Postscript reduced close from 14 days to 3 days.',
        'Migration from NetSuite completed in 3 weeks vs 5-month original implementation.',
        '200+ customers validate product-market fit.',
        '100M+ daily transactions prove enterprise-grade scalability.',
      ],
      founderNotes: 'We position against NetSuite for new customers and against Sage Intacct for the accounting-heavy buyer. QuickBooks migrations are easier to close but lower ACV.',
      generatedAt: now,
    },

    // ── Risk Register ────────────────────────────────────────
    riskRegister: {
      risks: [
        {
          id: crypto.randomUUID(),
          category: 'market',
          description: 'Oracle/Sage invest heavily in AI features for NetSuite/Intacct, narrowing Rillet\'s differentiation window.',
          likelihood: 'Medium',
          impact: 'High',
          mitigation: 'Move fast on multi-product expansion to deepen integration moat. Lock in customers with long-term contracts and data gravity before incumbents respond.',
          residualRisk: 'Medium — incumbents will improve but architectural rewrite is unlikely.',
          source: 'AI_SYNTHESIS',
        },
        {
          id: crypto.randomUUID(),
          category: 'execution',
          description: 'ERP sales cycles are long (3-6 months). Scaling sales team while maintaining unit economics is challenging.',
          likelihood: 'Medium',
          impact: 'Medium',
          mitigation: 'Product-led onboarding reduces sales-touch for SMB. Enterprise deals justify longer cycles given $100K+ ACV. Invest in customer success to drive NRR above 130%.',
          residualRisk: 'Low — proven go-to-market at current scale.',
          source: 'AI_SYNTHESIS',
        },
        {
          id: crypto.randomUUID(),
          category: 'technical',
          description: 'Data migration failures from legacy systems could damage reputation and slow customer acquisition.',
          likelihood: 'Low',
          impact: 'High',
          mitigation: 'Dedicated migration engineering team. Automated validation and reconciliation checks. 3-week typical migration timeline with hands-on support.',
          residualRisk: 'Low — migration tooling is mature and validated with 200+ customers.',
          source: 'AI_SYNTHESIS',
        },
        {
          id: crypto.randomUUID(),
          category: 'financial',
          description: 'High burn rate from large engineering team ($6M+/year) in a market with long sales cycles.',
          likelihood: 'Low',
          impact: 'Medium',
          mitigation: '$100M+ in total funding with $70M Series B provides multi-year runway. Strong gross margins (82%) support path to profitability.',
          residualRisk: 'Low — well-capitalised with favourable unit economics.',
          source: 'AI_SYNTHESIS',
        },
        {
          id: crypto.randomUUID(),
          category: 'organisational',
          description: 'Rapid scaling from 200 to 1000+ customers strains customer success and support teams.',
          likelihood: 'Medium',
          impact: 'Medium',
          mitigation: 'AI-first support (Aura handles routine queries). Invest in self-serve documentation and community. Hire CS leads before scaling pressure hits.',
          residualRisk: 'Low — AI automation inherently helps here.',
          source: 'AI_SYNTHESIS',
        },
      ],
      generatedAt: now,
      founderNotes: 'The incumbent response risk is real but we have a 3-5 year window. Focus is on getting to 500+ customers and $100M ARR before the window narrows.',
    },

    // ── Client List ──────────────────────────────────────────
    clientList: {
      entries: [
        {
          id: crypto.randomUUID(),
          companyName: 'Postscript',
          industry: 'SaaS — SMS Marketing',
          companySize: '300 employees',
          rationale: 'High-growth SaaS with complex revenue recognition needs. Early Rillet customer — reduced close from 14 to 3 days.',
          contactRole: 'VP Finance',
          status: 'qualified',
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          companyName: 'Windsurf',
          industry: 'SaaS — AI Developer Tools',
          companySize: '200 employees',
          rationale: 'Rapidly scaling AI company. Outgrew QuickBooks; needed multi-entity support for international expansion.',
          contactRole: 'Controller',
          status: 'qualified',
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          companyName: "Sotheby's",
          industry: 'Luxury Marketplace',
          companySize: '1800 employees',
          rationale: 'Complex multi-entity structure across global auction houses. High transaction volume with diverse revenue streams.',
          contactRole: 'CFO',
          status: 'qualified',
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          companyName: 'Ramp',
          industry: 'Fintech — Corporate Cards',
          companySize: '800 employees',
          rationale: 'High-growth fintech with massive transaction volume. Currently on NetSuite — likely feeling scaling pain.',
          contactRole: 'VP Finance',
          status: 'candidate',
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
        {
          id: crypto.randomUUID(),
          companyName: 'Notion',
          industry: 'SaaS — Productivity',
          companySize: '600 employees',
          rationale: 'High-growth SaaS with international entities and complex rev rec. Likely outgrowing mid-market accounting tools.',
          contactRole: 'Controller',
          status: 'candidate',
          source: 'AI_RESEARCH',
          generatedAt: now,
        },
      ],
      generatedAt: now,
    },

    // ── Investment Memo ──────────────────────────────────────
    investmentMemo: {
      content: {
        executiveSummary: 'Rillet is an AI-native ERP platform replacing legacy accounting software for high-growth companies. Founded in 2021 by Nicolas Kopp (ex-N26 US CEO) and Stelios Modes (ex-ThoughtWorks), the company has raised $100M+ including a $70M Series B led by a16z and ICONIQ Growth. With 200+ customers, 400+ finance teams, and 100M+ daily transactions, Rillet has demonstrated clear product-market fit in the $50B+ cloud ERP market.',
        theProblem: 'Finance teams at companies with 100-2000 employees are trapped between QuickBooks (too basic) and NetSuite (too rigid and expensive). Month-end close takes 10-15 business days. Teams spend 30-40% of their time on manual reconciliation. NetSuite implementations cost $200K+ and take 6+ months. There is no real-time financial visibility — data is always stale due to batch processing.',
        theSolution: 'Rillet\'s perpetual general ledger eliminates batch-based close entirely. Transactions are reconciled in real time. The Aura AI co-pilot automates journal entries, reconciliation, and anomaly detection. Revenue recognition (ASC 606), multi-entity consolidation, and financial reporting are built-in. Customers report reducing month-end close from 14 days to 3 days.',
        marketOpportunity: 'The global cloud ERP market exceeds $50B (TAM) with the mid-market AI-native accounting segment at ~$8B (SAM). The market is growing at 15%+ CAGR, driven by digital transformation and AI adoption. Legacy players (NetSuite, Sage Intacct) are architecturally constrained, creating a window for AI-native challengers.',
        competitiveLandscape: 'NetSuite ($2B+ revenue, Oracle) dominates but is rigid and expensive. Sage Intacct is strong in services but lacks AI. Puzzle targets smaller companies. Rillet occupies the unique intersection of enterprise-grade reliability and AI-native architecture for the high-growth mid-market.',
        businessModel: 'SaaS subscription priced by entity count and transaction volume. Typical ACV of $50-300K. 82% gross margins. NRR above 130% driven by multi-product expansion. CAC payback of ~3 months.',
        teamAndExecution: 'Nicolas Kopp (CEO): Former US CEO of N26, a $3.6B neobank. Deep fintech and operational experience. Stelios Modes (CTO): Former ThoughtWorks, enterprise systems architecture. The team has scaled to 200+ customers and 100M+ daily transactions. $100M+ in funding provides multi-year runway.',
        risksAndMitigations: 'Key risks: (1) Oracle/Sage bolt on AI features — mitigated by architectural moat and speed of execution. (2) Long ERP sales cycles — mitigated by product-led onboarding and high ACV. (3) Data migration complexity — mitigated by automated tooling (3-week typical migration). (4) Burn rate — mitigated by $100M+ funding and 82% gross margins.',
        validationEvidence: 'Customer interview (Postscript VP Finance): "Our close is now 3 days" — down from 14 days on NetSuite. Investor interview (a16z Partner): "Net revenue retention above 130%... the mid-market, high-growth segment — that\'s Rillet\'s to lose." 200+ paying customers and 400+ finance teams validate product-market fit at scale.',
        recommendation: 'Strong Advance. Rillet combines a massive market ($50B+), exceptional founders, proven traction, defensible architecture, and blue-chip investor backing. This is a rare opportunity to invest in an AI-native platform-shift in a market dominated by 20-year-old incumbents.',
      },
      citationIds: [],
      generatedAt: now,
      version: 1,
    },

    // ── Pitch Deck ───────────────────────────────────────────
    pitchDeck: {
      content: {
        '01': 'Rillet — The AI-Native ERP. Replacing legacy accounting for the modern finance team.',
        '02': 'The Problem: Finance teams spend 30-40% of their time fighting their tools. Month-end close takes 10-15 days. NetSuite implementations cost $200K+ and take 6 months. Legacy batch-based systems provide zero real-time visibility.',
        '03': 'The Solution: A perpetual general ledger with an AI co-pilot. Transactions reconciled in real time. Month-end close in 3 days. Aura AI automates journal entries, anomaly detection, and reconciliation.',
        '04': 'Market: $50B+ cloud ERP market. $8B SAM in mid-market AI-native accounting. 15%+ CAGR. Legacy incumbents architecturally constrained.',
        '05': 'Product: Perpetual GL, Aura AI co-pilot, revenue recognition (ASC 606), multi-entity consolidation, automated reporting. 100M+ transactions/day.',
        '06': 'Traction: 200+ customers. 400+ finance teams. 100M+ daily transactions. NRR >130%. Customers: Postscript, Windsurf, Sotheby\'s.',
        '07': 'Business Model: SaaS subscription. $50-300K ACV. 82% gross margins. CAC payback ~3 months. Multi-product expansion drives NRR.',
        '08': 'Competition: NetSuite (rigid, expensive), Sage Intacct (no AI), Puzzle (small companies). Rillet: enterprise scale + AI-native architecture.',
        '09': 'Team: Nicolas Kopp (CEO, ex-N26 US CEO), Stelios Modes (CTO, ex-ThoughtWorks). Backed by a16z, ICONIQ Growth.',
        '10': 'Traction & Validation: Close reduced from 14 to 3 days (Postscript). "Rillet\'s to lose" (a16z Partner). $70M Series B. $100M+ total raised.',
        '11': 'The Ask: Continued support for multi-product expansion into AP/AR and FP&A. Target: $200M ARR within 3 years.',
      },
      citationIds: [],
      generatedAt: now,
      version: 1,
    },

    // ── Stage 04: Design Partner Pipeline ─────────────────────
    designPartnerPipeline: {
      candidates: [
        {
          id: 'dp-postscript',
          companyName: 'Postscript',
          contactName: 'Emily Zhang',
          contactTitle: 'VP Finance',
          whyFit: 'High-growth e-commerce SaaS (SMS marketing) doing 200M+ transactions/month. Currently on NetSuite and experiencing 14-day close cycles. Ideal mid-market profile with acute pain around real-time revenue recognition.',
          pipelineStage: 'signed',
          qualification: {
            scores: [
              { dimension: 'ICP Match', weight: 20, score: 5, explanation: 'E-commerce SaaS, 100-500 employees, VP Finance buyer — perfect ICP fit.' },
              { dimension: 'Pain Acuteness', weight: 15, score: 5, explanation: '14-day close on NetSuite; 3 FTEs dedicated to reconciliation; missed board deadlines.' },
              { dimension: 'Willingness to Pay', weight: 15, score: 4, explanation: 'Currently paying $180K/yr for NetSuite. Budget available, seeking ROI within 6 months.' },
              { dimension: 'Decision Authority', weight: 15, score: 5, explanation: 'VP Finance has full authority over accounting stack decisions. CEO supportive of switch.' },
              { dimension: 'Data & Access', weight: 15, score: 4, explanation: 'Clean GL export available. ~18 months of history. Stripe and Shopify integrations needed.' },
              { dimension: 'Referencability', weight: 5, score: 5, explanation: 'Publicly endorses vendors; active in e-commerce finance community.' },
              { dimension: 'Strategic Fit', weight: 5, score: 5, explanation: 'E-commerce is a core vertical for Rillet. Postscript is a recognized brand.' },
              { dimension: 'Engagement Enthusiasm', weight: 10, score: 5, explanation: 'Proactively reached out after seeing Rillet at SaaStr. Eager to start pilot.' },
            ],
            total: 96,
            verdict: 'Strong Candidate',
            recommendation: 'Postscript is an ideal design partner given their acute NetSuite pain and perfect ICP match. Prioritize onboarding with a focus on the perpetual GL and Stripe integration. Their VP Finance is already an advocate and can serve as a reference customer.',
            generatedAt: now,
          },
          conversationNotes: 'Met Emily at SaaStr 2025. She described their 14-day close as "embarrassing" for a company their size. Team of 3 doing manual reconciliation. Very interested in perpetual GL concept. Loves the Aura AI demo — especially anomaly detection. Migration from NetSuite is her main concern. Followed up with a detailed ROI analysis showing 70% reduction in close time. Signed LOI within 2 weeks.',
          source: 'VL',
          addedAt: now,
          updatedAt: now,
        },
        {
          id: 'dp-windsurf',
          companyName: 'Windsurf (Codeium)',
          contactName: 'Marcus Chen',
          contactTitle: 'Head of Finance',
          whyFit: 'AI-native developer tools company, Series B, rapidly scaling. Using QuickBooks which is completely inadequate for their complexity. Multi-entity structure (US + EU) needs consolidation.',
          pipelineStage: 'loi',
          qualification: {
            scores: [
              { dimension: 'ICP Match', weight: 20, score: 5, explanation: 'AI SaaS, 200+ employees, Head of Finance buyer — strong ICP match.' },
              { dimension: 'Pain Acuteness', weight: 15, score: 4, explanation: 'QuickBooks is breaking; manual consolidation across 2 entities; no real-time visibility.' },
              { dimension: 'Willingness to Pay', weight: 15, score: 4, explanation: 'Series B funded ($150M), budget approved for ERP migration. Evaluating NetSuite vs. Rillet.' },
              { dimension: 'Decision Authority', weight: 15, score: 4, explanation: 'Head of Finance with CFO backing. Final sign-off needed from CFO.' },
              { dimension: 'Data & Access', weight: 15, score: 3, explanation: 'QuickBooks export quality is poor. Will need cleanup. 12 months of usable data.' },
              { dimension: 'Referencability', weight: 5, score: 4, explanation: 'High-profile AI company. Would be excellent social proof for AI-native segment.' },
              { dimension: 'Strategic Fit', weight: 5, score: 5, explanation: 'AI-native company using AI-native ERP — perfect narrative for Rillet marketing.' },
              { dimension: 'Engagement Enthusiasm', weight: 10, score: 4, explanation: 'Very engaged in evaluation. Requested custom demo of multi-entity consolidation.' },
            ],
            total: 86,
            verdict: 'Strong Candidate',
            recommendation: 'Windsurf is a high-value design partner for the multi-entity consolidation use case. Their AI-native identity aligns perfectly with Rillet\'s brand. Focus the pilot on US+EU consolidation and rev rec for their subscription billing.',
            generatedAt: now,
          },
          conversationNotes: 'Intro call with Marcus — they are evaluating NetSuite and Rillet in parallel. Key pain: manual consolidation of US and EU entities taking 5+ days/month. QuickBooks export is messy but manageable with migration tooling. Very interested in Aura AI for automated intercompany eliminations. Scheduled a deep-dive demo of multi-entity features. CFO joining next call.',
          source: 'VL',
          addedAt: now,
          updatedAt: now,
        },
        {
          id: 'dp-sothebys',
          companyName: "Sotheby's",
          contactName: 'James Harrington',
          contactTitle: 'Director of Financial Operations',
          whyFit: 'Global auction house with complex revenue recognition (consignment, buyer premiums, artist resale rights). Currently using SAP with heavy manual processes. Enterprise account with strong brand value as a reference.',
          pipelineStage: 'conversation',
          qualification: {
            scores: [
              { dimension: 'ICP Match', weight: 20, score: 3, explanation: 'Luxury/auction vertical is adjacent to core ICP but demonstrates platform versatility.' },
              { dimension: 'Pain Acuteness', weight: 15, score: 5, explanation: 'SAP-driven close takes 20+ days. Revenue recognition for consignments is extremely complex and manual.' },
              { dimension: 'Willingness to Pay', weight: 15, score: 5, explanation: 'Enterprise budget. Currently spending $500K+/yr on SAP + consulting. Actively exploring alternatives.' },
              { dimension: 'Decision Authority', weight: 15, score: 3, explanation: 'Director level — needs VP and CFO approval. Procurement process could be lengthy.' },
              { dimension: 'Data & Access', weight: 15, score: 2, explanation: 'SAP data migration is complex. 10+ years of history. Will require significant migration effort.' },
              { dimension: 'Referencability', weight: 5, score: 5, explanation: 'Iconic global brand. "Sotheby\'s uses Rillet" would be extraordinary social proof.' },
              { dimension: 'Strategic Fit', weight: 5, score: 3, explanation: 'Not core SaaS segment but proves enterprise readiness and complex rev rec capability.' },
              { dimension: 'Engagement Enthusiasm', weight: 10, score: 3, explanation: 'Interested but cautious. Has been burned by failed SAP upgrades. Needs strong proof of concept.' },
            ],
            total: 69,
            verdict: 'Conditional',
            recommendation: 'Sotheby\'s is conditional due to complex migration requirements and longer sales cycle. However, the brand value is exceptional. Recommend a limited pilot focused on one business unit\'s revenue recognition to prove capability before full commitment.',
            generatedAt: now,
          },
          conversationNotes: 'Initial intro via a16z portfolio network. James described their SAP environment as "legacy spaghetti." Revenue recognition for auction consignments involves 7+ manual steps. Very interested in Aura AI for automating consignment revenue calculations. Concerns about SAP data migration — they have 10 years of GL history. Suggested a phased approach starting with one subsidiary.',
          source: 'FOUNDER',
          addedAt: now,
          updatedAt: now,
        },
      ],
      generatedAt: now,
    },

    // ── Stage 04: Design Partner Feedback Summary ────────────
    designPartnerFeedbackSummary: {
      content: {
        commonThemes: [
          'Perpetual ledger concept resonates strongly — all partners cited real-time close as the #1 value proposition.',
          'Aura AI co-pilot is a key differentiator, especially for automated reconciliation and anomaly detection.',
          'Migration from legacy systems (NetSuite, SAP, QuickBooks) is the primary adoption concern across all partners.',
          'Multi-entity consolidation is a high-value feature for partners with international operations.',
          'Partners unanimously value the reduction in manual FTE effort on close and reconciliation tasks.',
        ],
        divergentFeedback: [
          'Postscript wants deep e-commerce integrations (Stripe, Shopify) while Windsurf prioritizes developer-tool billing systems.',
          'Sotheby\'s needs highly customizable revenue recognition rules that go beyond standard ASC 606; Postscript and Windsurf need standard SaaS rev rec.',
          'Windsurf expects API-first architecture for self-service; Sotheby\'s expects white-glove implementation support.',
          'Timeline expectations vary: Postscript wants to go live in 4 weeks, Sotheby\'s envisions a 6-month phased rollout.',
        ],
        strongestUseCases: [
          'Perpetual general ledger: Eliminating month-end close entirely. Postscript went from 14 days to 3 days in pilot.',
          'Aura AI anomaly detection: Catching reconciliation errors before they compound. Windsurf flagged this as their #1 feature request.',
          'Multi-entity consolidation: Automated intercompany eliminations for companies with US + international entities.',
          'Revenue recognition automation: ASC 606 compliance out of the box, reducing audit risk and manual journal entries.',
        ],
        productGaps: [
          'AP/AR module: Partners expect accounts payable and receivable functionality — not yet built.',
          'FP&A and budgeting: Financial planning and analysis features requested by all 3 partners for complete platform play.',
          'Custom report builder: Partners want to create ad-hoc financial reports beyond standard templates.',
          'Audit trail export: Sotheby\'s requires a detailed, timestamped audit trail for regulatory compliance.',
        ],
        narrative: 'Design partner feedback validates Rillet\'s core thesis: the perpetual ledger and Aura AI co-pilot represent a genuine paradigm shift from batch-based legacy ERP. All three partners — spanning e-commerce SaaS, AI developer tools, and luxury enterprise — confirmed that real-time close and AI-assisted reconciliation are compelling enough to justify migration from incumbent systems. The strongest signal comes from Postscript, who achieved a 79% reduction in close time during their pilot. Key concerns center on migration tooling and the absence of AP/AR and FP&A modules, which partners view as table stakes for a complete ERP replacement. The product gap analysis suggests that AP/AR should be the next major module after the core GL reaches general availability.',
      },
      partnerTags: [
        { partnerId: 'dp-postscript', companyName: 'Postscript' },
        { partnerId: 'dp-windsurf', companyName: 'Windsurf (Codeium)' },
        { partnerId: 'dp-sothebys', companyName: "Sotheby's" },
      ],
      generatedAt: now,
      version: 1,
    },

    // ── Stage 04: MVP Feature List ───────────────────────────
    mvpFeatureList: {
      features: [
        {
          id: 'mvpf-perpetual-gl',
          name: 'Perpetual General Ledger',
          description: 'Real-time, continuous ledger that eliminates batch-based month-end close. Transactions reconciled as they occur. Core architectural differentiator.',
          requestedByPartnerIds: ['dp-postscript', 'dp-windsurf', 'dp-sothebys'],
          moscow: 'Must Have',
          complexity: 'High',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-aura-copilot',
          name: 'Aura AI Co-pilot',
          description: 'AI assistant that automates journal entries, reconciliation, anomaly detection, and provides natural-language financial queries. Core AI differentiator.',
          requestedByPartnerIds: ['dp-postscript', 'dp-windsurf', 'dp-sothebys'],
          moscow: 'Must Have',
          complexity: 'High',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-rev-rec',
          name: 'Revenue Recognition (ASC 606)',
          description: 'Automated revenue recognition compliant with ASC 606 for SaaS subscription billing, usage-based pricing, and multi-element arrangements.',
          requestedByPartnerIds: ['dp-postscript', 'dp-windsurf'],
          moscow: 'Must Have',
          complexity: 'High',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-multi-entity',
          name: 'Multi-Entity Consolidation',
          description: 'Automated intercompany eliminations and consolidation for companies with multiple legal entities across jurisdictions.',
          requestedByPartnerIds: ['dp-windsurf', 'dp-sothebys'],
          moscow: 'Must Have',
          complexity: 'High',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-migration-tooling',
          name: 'Automated Migration Tooling',
          description: 'ETL pipeline for migrating GL data from NetSuite, QuickBooks, SAP, and Xero. Target: 3-week migration timeline with data validation.',
          requestedByPartnerIds: ['dp-postscript', 'dp-windsurf', 'dp-sothebys'],
          moscow: 'Must Have',
          complexity: 'Medium',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-stripe-integration',
          name: 'Stripe & Payment Gateway Integration',
          description: 'Native integration with Stripe, Shopify Payments, and other payment processors for automated transaction ingestion and reconciliation.',
          requestedByPartnerIds: ['dp-postscript'],
          moscow: 'Should Have',
          complexity: 'Medium',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-financial-reporting',
          name: 'Standard Financial Reports',
          description: 'Income statement, balance sheet, cash flow statement, and trial balance with drill-down capabilities and period comparisons.',
          requestedByPartnerIds: ['dp-postscript', 'dp-windsurf'],
          moscow: 'Should Have',
          complexity: 'Medium',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-audit-trail',
          name: 'Audit Trail & Compliance Export',
          description: 'Immutable, timestamped audit trail for every transaction and journal entry. Exportable for SOX compliance and external audit requirements.',
          requestedByPartnerIds: ['dp-sothebys'],
          moscow: 'Should Have',
          complexity: 'Medium',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-api-first',
          name: 'Developer API & Webhooks',
          description: 'REST and GraphQL APIs for programmatic access to financial data. Webhooks for real-time event notifications. SDK for common languages.',
          requestedByPartnerIds: ['dp-windsurf'],
          moscow: 'Should Have',
          complexity: 'Medium',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-custom-reports',
          name: 'Custom Report Builder',
          description: 'Drag-and-drop report builder for ad-hoc financial analysis. Save and schedule reports. Export to PDF, Excel, and CSV.',
          requestedByPartnerIds: ['dp-postscript', 'dp-sothebys'],
          moscow: 'Nice to Have',
          complexity: 'Medium',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
        {
          id: 'mvpf-apar',
          name: 'Accounts Payable & Receivable',
          description: 'Full AP/AR module with invoice management, payment tracking, aging reports, and automated reminders. Identified as a key product gap by all partners.',
          requestedByPartnerIds: ['dp-postscript', 'dp-windsurf', 'dp-sothebys'],
          moscow: 'Nice to Have',
          complexity: 'High',
          source: 'AI_SYNTHESIS',
          addedAt: now,
        },
      ],
      generatedAt: now,
    },

    // ── Stage 05: MVP Readiness ───────────────────────────────
    technicalArchitecture: {
      content: {
        techStack: 'Frontend: React/TypeScript; Backend: Node.js (TypeScript), event-sourced ledger service; Data: PostgreSQL (ledger events), Redis (cache); AI: Aura co-pilot (internal ML pipeline); Infra: AWS (EKS, RDS, S3).',
        componentDiagram: 'Web App (React) -> API Gateway -> Ledger Service (event-sourced) + Aura AI Service; Ledger Service -> PostgreSQL (events, snapshots); Integrations layer (Stripe, NetSuite ETL, bank feeds) -> Ledger Service.',
        integrationPoints: 'Stripe, Shopify Payments, bank feeds (Plaid), NetSuite/QuickBooks/SAP migration ETL, chart-of-accounts mapping service. Future: payroll (Gusto), CRM (Salesforce).',
        keyDecisions: 'Event-sourced ledger for audit trail and real-time consistency; Aura as a separate service to allow independent scaling; PostgreSQL for durability with read replicas for reporting; migration ETL as first-class product to reduce adoption friction.',
        risksAndOpenQuestions: 'Event store growth and snapshot strategy at 1B+ events; Aura model refresh latency vs real-time requirements; multi-tenant data isolation at scale.',
      },
      generatedAt: now,
      source: 'AI_SYNTHESIS',
    },
    productRoadmap: {
      phases: [
        {
          phase: 'MVP',
          milestones: ['Perpetual GL GA', 'Aura anomaly detection GA', 'Postscript and Windsurf live', 'Migration tooling certified for NetSuite + QuickBooks'],
          featuresInScope: ['Perpetual General Ledger', 'Aura AI Co-pilot', 'Revenue Recognition (ASC 606)', 'Multi-Entity Consolidation', 'Automated Migration Tooling', 'Stripe Integration'],
          successCriteria: ['3 design partners live; close time under 5 days', 'Zero critical data integrity issues', 'NPS > 40'],
          capitalRequirement: 'Existing Series B runway; no additional raise for MVP.',
        },
        {
          phase: 'V1 Commercial',
          milestones: ['AP/AR module beta', '50 paying customers', 'Enterprise security certification (SOC 2 Type II)'],
          featuresInScope: ['Accounts Payable & Receivable', 'Custom Report Builder', 'Audit Trail & Compliance Export', 'Developer API & Webhooks'],
          successCriteria: ['$2M ARR', 'Net revenue retention > 120%', 'Migration timeline < 4 weeks for 80% of pilots'],
          capitalRequirement: 'Growth capital for GTM; optional extension round in 18 months.',
        },
        {
          phase: 'V2 Scale',
          milestones: ['FP&A module', '200+ customers', '$50M ARR'],
          featuresInScope: ['FP&A and budgeting', 'Advanced multi-entity', 'Industry templates (e-commerce, SaaS)'],
          successCriteria: ['$50M ARR', 'Expansion into 2 new verticals', 'Platform extensibility (partner integrations)'],
          capitalRequirement: 'Series C or profitability path.',
        },
      ],
      generatedAt: now,
      source: 'AI_SYNTHESIS',
    },
    featurePrdList: {
      prds: [
        {
          id: 'prd-perpetual-gl',
          featureId: 'mvpf-perpetual-gl',
          name: 'Perpetual General Ledger',
          userStory: 'As a VP Finance, I want every transaction to be reconciled in real time so that month-end close is eliminated and I have instant financial visibility.',
          acceptanceCriteria: ['All posted transactions appear in trial balance within 60 seconds', 'No batch close job; close is a point-in-time snapshot', 'Audit trail records every state change'],
          inScope: ['Real-time posting', 'Continuous reconciliation', 'Trial balance and period snapshots'],
          outOfScope: ['Offline mode', 'Manual override of reconciliation rules in MVP'],
          dependencies: ['PostgreSQL event store', 'Chart of accounts service'],
          designPartnerOrigin: 'Postscript, Windsurf, Sotheby\'s',
          generatedAt: now,
          source: 'AI_SYNTHESIS',
        },
        {
          id: 'prd-aura',
          featureId: 'mvpf-aura-copilot',
          name: 'Aura AI Co-pilot',
          userStory: 'As a finance manager, I want an AI assistant that suggests journal entries and flags anomalies so that I spend less time on manual reconciliation and more on analysis.',
          acceptanceCriteria: ['Aura suggests journal entries with >90% acceptance rate in pilot', 'Anomaly detection surfaces outliers within 24 hours', 'Natural-language queries return accurate financial summaries'],
          inScope: ['Journal entry suggestions', 'Anomaly detection', 'NL queries for standard reports'],
          outOfScope: ['Full FP&A forecasting', 'Custom model training by customer'],
          dependencies: ['Perpetual GL (source of truth)', 'Aura ML pipeline'],
          designPartnerOrigin: 'Postscript, Windsurf',
          generatedAt: now,
          source: 'AI_SYNTHESIS',
        },
      ],
      generatedAt: now,
    },
    sprintPlan: {
      sprints: [
        { sprintNumber: 1, durationWeeks: 2, featuresInScope: ['Perpetual GL – core posting API'], definitionOfDone: 'API accepts posts; trial balance correct for test data', acceptanceCriteria: ['Post and retrieve transactions', 'Trial balance endpoint'] },
        { sprintNumber: 2, durationWeeks: 2, featuresInScope: ['Perpetual GL – reconciliation engine'], definitionOfDone: 'Auto-reconciliation runs on new transactions', acceptanceCriteria: ['Reconciliation rules executed', 'Unreconciled items report'] },
        { sprintNumber: 3, durationWeeks: 2, featuresInScope: ['Aura – anomaly detection MVP'], definitionOfDone: 'Anomaly detection job runs daily; flags surfaced in UI', acceptanceCriteria: ['Detection model trained on sample data', 'Flags visible in dashboard'] },
        { sprintNumber: 4, durationWeeks: 2, featuresInScope: ['Migration ETL – NetSuite connector'], definitionOfDone: 'NetSuite export ingested and mapped to Rillet chart of accounts', acceptanceCriteria: ['ETL pipeline for NetSuite', 'Mapping UI for CoA'] },
      ],
      assumptions: [
        { label: 'Team size', value: '2 backend, 1 frontend, 1 data/AI', source: 'VL' as const },
        { label: 'Velocity', value: '8 story points per sprint', source: 'AI_SYNTHESIS' as const },
        { label: 'Scope stability', value: 'No new MVP features during first 4 sprints', source: 'FOUNDER' as const },
      ],
      generatedAt: now,
      source: 'AI_SYNTHESIS',
    },

    // ── Stage 06: Build & Pilot ────────────────────────────────
    clientFeedbackSummary: {
      content: {
        themes: ['Pilot users confirm 3–5 day close vs 10–14 days on legacy systems', 'Aura anomaly detection is highly valued; users want more proactive alerts', 'Migration timeline is the main adoption blocker for enterprises'],
        divergence: ['Postscript wants more e-commerce integrations; Sotheby\'s prioritizes audit trail and custom rev rec', 'Pricing expectations vary: mid-market expects usage-based; enterprise expects flat annual'],
        topSignals: ['Postscript VP Finance: "Our close is now 3 days"', 'Windsurf committed to multi-entity pilot', 'Strong interest in AP/AR as next module'],
        productGaps: ['AP/AR module', 'Custom report builder', 'Audit trail export for compliance'],
        narrative: 'Pilot feedback from Postscript, Windsurf, and early enterprise conversations validates the perpetual ledger and Aura as differentiators. Close time reduction is the strongest proof point. Migration and AP/AR remain the top asks for broader rollout.',
      },
      clientTags: [
        { clientId: 'c-postscript', companyName: 'Postscript' },
        { clientId: 'c-windsurf', companyName: 'Windsurf (Codeium)' },
        { clientId: 'c-sothebys', companyName: "Sotheby's" },
      ],
      generatedAt: now,
      source: 'AI_SYNTHESIS',
    },
    updatedRoadmap: {
      phases: [
        {
          phase: 'MVP',
          milestones: ['Perpetual GL GA', 'Aura GA', 'Postscript + Windsurf live', 'Migration tooling GA'],
          featuresInScope: ['Perpetual GL', 'Aura', 'Rev Rec', 'Multi-entity', 'Migration', 'Stripe'],
          successCriteria: ['3 pilots live; close under 5 days', 'NPS > 40'],
          capitalRequirement: 'Series B runway',
        },
        {
          phase: 'V1 Commercial',
          milestones: ['AP/AR beta', '50 customers', 'SOC 2 Type II'],
          featuresInScope: ['AP/AR', 'Custom reports', 'Audit trail', 'API'],
          successCriteria: ['$2M ARR', 'NRR > 120%'],
          capitalRequirement: 'GTM growth',
        },
        {
          phase: 'V2 Scale',
          milestones: ['FP&A', '200+ customers', '$50M ARR'],
          featuresInScope: ['FP&A', 'Industry templates'],
          successCriteria: ['$50M ARR', '2 new verticals'],
          capitalRequirement: 'Series C or profitability',
        },
      ],
      generatedAt: now,
      source: 'AI_SYNTHESIS',
    },
    pricingLab: {
      assumptions: [
        { id: 'pla-1', label: 'Target ACV (mid-market)', value: 120000, source: 'VL' as const, confidence: 'High', updatedAt: now },
        { id: 'pla-2', label: 'Willingness to pay (from pilots)', value: '$80K–$150K/year', source: 'CLIENT_INTERVIEW' as const, confidence: 'High', updatedAt: now },
        { id: 'pla-3', label: 'Competitive benchmark (NetSuite)', value: '$150K–$250K/year for similar scope', source: 'AI_RESEARCH' as const, confidence: 'Medium', citation: { title: 'NetSuite Mid-Market Pricing 2024', url: 'https://example.com/netsuite-pricing' }, updatedAt: now },
        { id: 'pla-4', label: 'Founder instinct on discounting', value: 'Max 15% for annual prepay; no discount for monthly', source: 'FOUNDER' as const, confidence: 'High', updatedAt: now },
      ],
      recommendation: {
        tierStructure: 'Starter (single entity, up to 5M transactions/year), Growth (multi-entity, 5M–50M), Enterprise (unlimited, custom SLA).',
        pricePoints: 'Starter: $72K/year ($6K/mo); Growth: $120K/year ($10K/mo); Enterprise: custom, anchor $200K+.',
        discountingPolicy: 'Up to 15% for annual prepay. No discount for monthly. Pilot discount: 20% for first 12 months, then list.',
        rationale: 'Pilot feedback and competitive benchmarks support $80K–$150K as the sweet spot. Tier structure aligns with entity count and volume. Discounting policy preserves margin while encouraging annual commitment.',
        generatedAt: now,
        source: 'AI_SYNTHESIS',
      },
      versionHistory: [],
    },

    // ── Stage 07: Commercial ──────────────────────────────────
    pricingImplementationTracker: {
      pricingLabSnapshot: {
        tierStructure: 'Starter, Growth, Enterprise',
        pricePoints: 'Starter $72K/yr; Growth $120K/yr; Enterprise custom $200K+',
        discountingPolicy: '15% annual prepay; 20% pilot year one',
        rationale: 'Aligned with pilot WTP and competitive benchmarks.',
        generatedAt: now,
        source: 'AI_SYNTHESIS',
      },
      rolloutStatus: 'Pilot pricing live with Postscript and Windsurf. Standard list pricing published. Enterprise tier in negotiation with 2 accounts.',
      milestones: ['Pilot pricing signed (Postscript, Windsurf)', 'List pricing published', 'First Enterprise LOI', 'Standard contract template approved'],
      generatedAt: now,
      source: 'VL',
    },
    gtmTracker: {
      gtmPlan: '10: Land 10 design partners and early adopters (Postscript, Windsurf, +8) with pilot pricing. 50: Scale outbound to mid-market finance leaders; target $2M ARR. 100: Enterprise motion with dedicated team; expand to 2 verticals (e-commerce, AI/tech).',
      pricingImplementationPlan: 'Pilot discount (20%) for first 12 months. Migrate to list at renewal. Enterprise tier uses custom terms; target 2 signed by end of year.',
      signedSowTracker: [
        { company: 'Postscript', status: 'Signed' },
        { company: 'Windsurf (Codeium)', status: 'LOI' },
        { company: 'Sotheby\'s', status: 'Conversation' },
      ],
      generatedAt: now,
      source: 'VL',
    },
  }
}
