import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";

// ─── CSS Variables & Global Styles ───────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
  
  :root {
    --bg: #13111C;
    --surface: #1E1A2E;
    --border: #2E2A45;
    --accent-primary: #7C6AF7;
    --accent-secondary: #4F9CF9;
    --accent-warning: #F59E0B;
    --accent-danger: #EF4444;
    --accent-success: #10B981;
    --text-primary: #F0EEFF;
    --text-muted: #8B87A8;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, html, #root { 
    background: var(--bg); 
    color: var(--text-primary); 
    font-family: 'Sora', sans-serif;
    height: 100%; 
    overflow: hidden;
  }
  
  .font-mono { font-family: 'IBM Plex Mono', monospace; }
  .font-heading { font-family: 'Sora', sans-serif; }

  .glass-card {
    background: rgba(30,26,46,0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  .glass-card-hover:hover {
    border-color: var(--accent-primary);
    transform: translateY(-2px);
    transition: all 0.2s ease;
  }

  .scrollbar-thin::-webkit-scrollbar { width: 6px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: var(--accent-primary); }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }

  .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
  .animate-slideIn { animation: slideIn 0.3s ease forwards; }
  .dot-pulse span { animation: pulse 1.2s infinite; }
  .dot-pulse span:nth-child(2) { animation-delay: 0.2s; }
  .dot-pulse span:nth-child(3) { animation-delay: 0.4s; }

  input, textarea, select {
    font-family: 'Sora', sans-serif;
    background: rgba(30,26,46,0.5);
    border: 1px solid var(--border);
    color: var(--text-primary);
    border-radius: 8px;
    padding: 8px 12px;
    outline: none;
    transition: border-color 0.2s;
  }
  input:focus, textarea:focus, select:focus { border-color: var(--accent-primary); }
  textarea { resize: vertical; min-height: 60px; }

  button { font-family: 'Sora', sans-serif; cursor: pointer; transition: all 0.2s; }
`;

// ─── Source Tag System ───────────────────────────────────────────────────────
const SOURCE_COLORS = {
  FOUNDER: "#4F9CF9",
  VL: "#F59E0B",
  AI_SYNTHESIS: "#7C6AF7",
  AI_RESEARCH: "#0EA5E9",
  PRESSURE_TEST: "#F97316",
  SCORING: "#10B981",
  PITCH: "#F43F5E",
  DESIGN_PARTNER: "#06B6D4",
  BIZ_CASE: "#EAB308",
  PORTFOLIO_RPT: "#94A3B8",
};

const SOURCE_LABELS = {
  FOUNDER: "Founder Input",
  VL: "Venture Lead",
  AI_SYNTHESIS: "AI Synthesis",
  AI_RESEARCH: "AI Research",
  PRESSURE_TEST: "Pressure Test",
  SCORING: "Scoring Model",
  PITCH: "Pitch Deck",
  DESIGN_PARTNER: "Design Partner",
  BIZ_CASE: "Business Case",
  PORTFOLIO_RPT: "Portfolio Report",
};

function makeField(value, source, subSource = null) {
  return {
    value,
    source,
    subSource,
    timestamp: new Date().toISOString(),
    history: [{ value, source, subSource, timestamp: new Date().toISOString() }],
  };
}

function SourceChip({ source, subSource, small = false }) {
  const color = SOURCE_COLORS[source] || "#8B87A8";
  const label = SOURCE_LABELS[source] || source;
  const displayLabel = subSource ? `${label} · ${subSource}` : label;
  return (
    <span
      className="font-mono inline-flex items-center rounded-full whitespace-nowrap"
      style={{
        fontSize: small ? "9px" : "10px",
        padding: small ? "1px 6px" : "2px 8px",
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}40`,
        letterSpacing: "0.02em",
        fontWeight: 500,
      }}
    >
      {displayLabel}
    </span>
  );
}

// ─── API Call Helper ─────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage, maxTokens = 1000) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return data.content?.map((b) => b.text || "").join("") || "";
  } catch (e) {
    throw new Error(`Claude API error: ${e.message}`);
  }
}

async function callClaudeJSON(systemPrompt, userMessage, maxTokens = 1000) {
  const raw = await callClaude(systemPrompt, userMessage, maxTokens);
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Stages ──────────────────────────────────────────────────────────────────
const STAGES = [
  { id: "01", name: "Discover", focus: "Opportunity space" },
  { id: "02", name: "Define", focus: "Articulate opportunity" },
  { id: "03", name: "Incubate", focus: "De-risk through experimentation" },
  { id: "04", name: "Design & Validate", focus: "Co-create with partners" },
  { id: "05", name: "MVP Readiness", focus: "Architecture & team" },
  { id: "06", name: "MVP Build & Pilot", focus: "Track the build" },
  { id: "07", name: "Commercial Validation", focus: "Market entry" },
];

function StageBadge({ stageId, small = false }) {
  const stage = STAGES.find((s) => s.id === stageId);
  const colors = {
    "01": "#8B87A8", "02": "#7C6AF7", "03": "#F59E0B",
    "04": "#4F9CF9", "05": "#0EA5E9", "06": "#10B981", "07": "#F43F5E",
  };
  const c = colors[stageId] || "#8B87A8";
  return (
    <span
      className="font-mono inline-flex items-center rounded-md whitespace-nowrap"
      style={{
        fontSize: small ? "10px" : "11px",
        padding: small ? "2px 6px" : "3px 8px",
        background: `${c}18`,
        color: c,
        border: `1px solid ${c}40`,
        fontWeight: 600,
      }}
    >
      S{stageId} {stage?.name}
    </span>
  );
}

function StatusChip({ status }) {
  const c = status === "On Track" ? "#10B981" : status === "At Risk" ? "#F59E0B" : "#EF4444";
  return (
    <span
      className="font-mono inline-flex items-center rounded-full"
      style={{ fontSize: "10px", padding: "2px 8px", background: `${c}18`, color: c, border: `1px solid ${c}40`, fontWeight: 500 }}
    >
      {status}
    </span>
  );
}

// ─── Seed Data ───────────────────────────────────────────────────────────────
function createSeedData() {
  const now = new Date().toISOString();
  const ventures = {
    clearclose: {
      id: "clearclose",
      name: makeField("ClearClose", "VL"),
      stage: makeField("03", "VL"),
      founder: makeField("Sarah Chen", "VL"),
      status: makeField("At Risk", "VL"),
      description: makeField(
        "AI-native M&A integration intelligence platform that reduces post-merger operational disruption for mid-market PE-backed companies.",
        "FOUNDER"
      ),
      interview: {
        completed: true,
        sections: {
          "The Idea": makeField("An AI platform that ingests both acquirer and target company data — org charts, tech stacks, contracts, workflows — and builds a unified integration playbook in days instead of months. Origin: Sarah spent 6 years at a PE firm watching $50M+ deals lose 30-40% of projected synergies due to botched integrations.", "FOUNDER"),
          "Pain Points & Problem Depth": makeField("Mid-market PE firms ($100M-$2B deal size) lose an average of 35% of projected deal synergies in the first 18 months post-close. Integration teams rely on spreadsheets and consultants billing $500/hr. The pain is acute for portfolio ops teams managing 4-8 simultaneous integrations. Current workaround: Big Four firms charging $2-5M per integration.", "FOUNDER"),
          "Ideal Customer Profile": makeField("PE-backed portfolio companies, 500-5000 employees, going through their 2nd+ acquisition. Buyer: VP of Integration or Chief Integration Officer. Decision unit includes CFO and COO. Sweet spot: companies doing 2+ tuck-in acquisitions per year.", "FOUNDER"),
          "The Solution": makeField("Automated data ingestion from both entities, AI-driven gap analysis across 12 integration workstreams (IT, HR, Finance, Legal, Operations, etc.), dynamic playbook generation with task dependencies and risk flags. Does NOT replace integration PMO — augments them. Does NOT handle legal/regulatory compliance directly.", "FOUNDER"),
          "Revenue Model": makeField("Per-integration license: $150K for standard (single integration), $400K for enterprise (unlimited integrations per year). 85% gross margin target. Unit economics intuition: replaces $2-5M in consulting fees, so 10x value gap.", "FOUNDER"),
          "Why Now": makeField("Three converging forces: (1) LLMs can now parse unstructured corporate documents at scale, (2) PE deal volume rebounding after 2023 pause with $2.5T in dry powder, (3) integration failure rates haven't improved in 20 years despite more M&A activity. Three years ago, the NLP wasn't good enough to handle the document variety.", "FOUNDER"),
          "Team & Founder Fit": makeField("Sarah Chen — 6 years PE portfolio ops at Summit Partners, 3 years McKinsey M&A practice. CTO: James Liu — ex-Palantir, built data integration systems for government clients. Gap: need a Head of Sales with enterprise PE relationships.", "FOUNDER"),
          "Traction & Evidence": makeField("3 LOIs from mid-market PE firms (Audax, GTCR, Thoma Bravo portfolio). 12 discovery calls completed. One firm offered to be a design partner with live deal data. No revenue yet.", "FOUNDER"),
        },
      },
      scoring: {
        corporate: makeField({
          scores: { "Strategic Alignment": 4, "Horizon Classification": 3, "Internal Sponsorship": 3, "Organizational Readiness": 3, "Innovation Type": 4, "Cannibalization Risk": 2, "Build/Buy/Partner Fit": 4 },
          horizon: "H2",
          recommendation: "Strong strategic alignment with KPMG's M&A advisory practice. H2 opportunity with clear adjacency to existing deal services. Requires dedicated sponsorship from M&A leadership to avoid organizational friction.",
        }, "SCORING", "Corporate Innovation"),
        vc: makeField({
          scores: { "Market Size": 4, "Problem Severity": 5, "Solution Differentiation": 3, "Founder-Market Fit": 4, "Business Model Quality": 4, "Timing/Why Now": 5, "Competitive Moat": 3, "Traction Signal": 3 },
          fundability: "Conditional",
          assessment: "Strong problem-market timing convergence. Founder has direct domain experience. Differentiation risk: Palantir and large consultancies could build similar capabilities. Conditional on demonstrating data moat from first 3 integrations.",
        }, "SCORING", "VC Lens"),
        studio: makeField({
          scores: { "Design Partner Readiness": 4, "Prototype-ability": 4, "Studio Unfair Advantage": 3, "Stage-Gate Progressibility": 3, "Founder Accountability": 4, "Capital Efficiency": 3, "Exit Path Clarity": 3, "Client Validation Signal": 3 },
          recommendation: "Validate First",
          assessment: "Design partners are available and eager. Prototype scope is manageable. Studio advantage is moderate — KPMG M&A relationships are the key lever. Validate unit economics with first integration before committing full incubation capital.",
        }, "SCORING", "Studio Lens"),
      },
      compositeSignal: makeField("Caution", "SCORING"),
      pressureTests: [
        {
          persona: "The Unit Economics Enforcer",
          completed: true,
          timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
          challenges: [
            makeField("At $150K per integration, you need 67 deals/year to hit $10M ARR. Mid-market PE firms do 2-4 deals/year. How many firms do you need, and what's your realistic close rate?", "PRESSURE_TEST", "Unit Economics Enforcer"),
            makeField("Your 85% gross margin assumes minimal human-in-the-loop. But M&A integration is messy — what happens when the AI misclassifies a critical contract dependency? Who's liable?", "PRESSURE_TEST", "Unit Economics Enforcer"),
            makeField("Consulting firms charge $2-5M because they provide bodies, not just software. Your $150K price point suggests you're replacing the tool, not the team. But the team IS the product for most PE firms. Where exactly do you sit in the value chain?", "PRESSURE_TEST", "Unit Economics Enforcer"),
          ],
          summary: makeField({
            strongestChallenges: ["Unit economics path to $10M ARR requires 40+ PE firm clients at unrealistic close rates", "Liability model unclear when AI misclassifies critical integration dependencies", "Value chain positioning ambiguous — tool vs. service replacement"],
            responseQuality: { 0: "Adequate", 1: "Weak", 2: "Adequate" },
            unresolvedVulnerabilities: ["Path to $10M ARR math doesn't hold without enterprise tier adoption", "No clear answer on liability model", "Needs sharper positioning against consulting alternative"],
          }, "PRESSURE_TEST", "Unit Economics Enforcer"),
        },
      ],
      pitchDeck: null,
      businessCase: makeField({
        status: "partial",
        sections: {
          "Executive Summary": { content: "ClearClose addresses the $4.2B post-merger integration services market by replacing manual, consultant-driven integration planning with AI-powered playbook generation. Asking for $750K to advance through Stage 04 design partner validation. Recommendation: Approve with conditions pending competitive landscape validation.", source_citations: ["FOUNDER", "AI_SYNTHESIS"], gap_alerts: [] },
          "Problem & Market Opportunity": { content: "PE-backed companies lose 35% of projected deal synergies due to integration failures. TAM: $4.2B (integration consulting market for deals $100M-$2B). SAM: $1.2B (mid-market PE firms with 2+ acquisitions/year). SOM: $50M (Year 3 target — 330 integrations at blended $150K).", source_citations: ["FOUNDER", "AI_RESEARCH"], gap_alerts: [] },
          "Competitive Landscape": { content: null, source_citations: [], gap_alerts: ["Competitive landscape section incomplete. No systematic analysis of Bain Integration Toolkit, DealRoom, Midaxo, or Palantir's M&A offering. Required before Investment Committee review."] },
        },
        conditions: [
          { text: "Complete competitive landscape analysis", checked: false },
          { text: "Validate unit economics with at least 1 paid pilot", checked: false },
          { text: "Secure Head of Sales candidate pipeline", checked: false },
          { text: "Confirm KPMG M&A practice sponsorship", checked: true },
        ],
        verdict: "Approve with Conditions",
      }, "BIZ_CASE"),
      designPartners: [],
      weeklyNotes: makeField("Competitive landscape gap is the main blocker. Sarah has calls scheduled with 3 PE firms this week to validate pricing model.", "VL"),
    },

    flowstate: {
      id: "flowstate",
      name: makeField("FlowState", "VL"),
      stage: makeField("04", "VL"),
      founder: makeField("Michael Torres", "VL"),
      status: makeField("On Track", "VL"),
      description: makeField(
        "Workforce composition intelligence tool helping CHROs model human-agent teaming scenarios and workforce transition planning for the AI era.",
        "FOUNDER"
      ),
      interview: {
        completed: true,
        sections: {
          "The Idea": makeField("A planning tool that helps HR leaders model what their workforce looks like when AI agents handle 20%, 40%, 60% of current tasks — and build transition roadmaps that are humane, practical, and defensible to the board. Not a replacement tool — a composition planning tool.", "FOUNDER"),
          "Pain Points & Problem Depth": makeField("CHROs are under board pressure to have an 'AI workforce strategy' but have zero tools to model scenarios. Current approach: hire McKinsey for $3M, get a PDF, put it in a drawer. Pain is most acute at companies with 5,000-50,000 employees where workforce restructuring is a $100M+ decision. 78% of CHROs surveyed say they lack tools to plan for AI-augmented workforce.", "FOUNDER"),
          "Ideal Customer Profile": makeField("Enterprise companies, 5,000-50,000 employees, in industries facing significant AI automation potential (financial services, professional services, insurance, healthcare admin). Buyer: CHRO or SVP of Workforce Strategy. Decision unit: CHRO + CFO + CIO. Trigger: board asking for AI workforce strategy.", "FOUNDER"),
          "The Solution": makeField("Ingests org structure, role data, and task-level workflows. Maps each role's task composition against AI capability benchmarks. Models scenarios: 'What if we deploy AI agents for X% of claims processing?' Shows headcount impact, reskilling needs, cost savings, and timeline. Produces board-ready transition roadmaps. Does NOT make hiring/firing decisions. Does NOT integrate with HRIS for automated actions.", "FOUNDER"),
          "Revenue Model": makeField("Annual SaaS license: $200K for mid-enterprise (5K-15K employees), $500K for large enterprise (15K-50K employees). Implementation fee: $50K-$100K. 80% gross margin. LTV/CAC intuition: 3-year contracts, $600K-$1.5M LTV, targeting $60K-$150K CAC through CHRO network events and advisory board.", "FOUNDER"),
          "Why Now": makeField("(1) GenAI has made the 'AI replacing tasks' conversation real — not theoretical. Every board is asking. (2) No incumbent HR tech vendor (Workday, SAP SuccessFactors) has a workforce composition modeling tool. (3) Regulatory pressure: EU AI Act requires workforce impact assessments for high-risk AI deployments. This was science fiction 3 years ago.", "FOUNDER"),
          "Team & Founder Fit": makeField("Michael Torres — 12 years in HR tech (VP Product at Visier, Dir of Analytics at Mercer). Deep relationships with 50+ CHROs. CTO: Priya Sharma — ex-Google Brain, built workforce analytics models at Scale AI. Advisor: Josh Bersin (leading HR industry analyst). Gap: enterprise sales lead.", "FOUNDER"),
          "Traction & Evidence": makeField("7 CHRO discovery calls completed — all expressed budget availability. 2 signed design partner LOIs (Fortune 500 insurer, Big 4 accounting firm). Josh Bersin offered to co-host a CHRO roundtable to generate pipeline. No revenue yet.", "FOUNDER"),
        },
      },
      scoring: {
        corporate: makeField({
          scores: { "Strategic Alignment": 5, "Horizon Classification": 4, "Internal Sponsorship": 4, "Organizational Readiness": 4, "Innovation Type": 4, "Cannibalization Risk": 1, "Build/Buy/Partner Fit": 5 },
          horizon: "H2",
          recommendation: "Exceptional strategic alignment with KPMG's People & Change practice. Low cannibalization risk. Strong build case — KPMG's HR advisory relationships provide direct distribution channel. High-priority incubation candidate.",
        }, "SCORING", "Corporate Innovation"),
        vc: makeField({
          scores: { "Market Size": 5, "Problem Severity": 4, "Solution Differentiation": 4, "Founder-Market Fit": 5, "Business Model Quality": 4, "Timing/Why Now": 5, "Competitive Moat": 3, "Traction Signal": 4 },
          fundability: "Strong",
          assessment: "Exceptional timing play — every enterprise board is asking for this. Founder has rare combination of HR domain expertise and industry relationships. Main risk: Workday or ServiceNow could build competitive feature within 18 months. Moat depends on data network effects from early enterprise deployments.",
        }, "SCORING", "VC Lens"),
        studio: makeField({
          scores: { "Design Partner Readiness": 5, "Prototype-ability": 4, "Studio Unfair Advantage": 5, "Stage-Gate Progressibility": 4, "Founder Accountability": 5, "Capital Efficiency": 4, "Exit Path Clarity": 4, "Client Validation Signal": 4 },
          recommendation: "Incubate",
          assessment: "Strongest candidate in current portfolio. Studio unfair advantage is high — KPMG's CHRO relationships and workforce advisory practice provide unmatched distribution. Design partners secured. Recommend full incubation with aggressive timeline.",
        }, "SCORING", "Studio Lens"),
      },
      compositeSignal: makeField("Advance", "SCORING"),
      pressureTests: [
        {
          persona: "The Skeptical VC", completed: true,
          timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
          challenges: [
            makeField("Workday has 60M+ worker records. The moment this category proves out, they ship a feature. What's your 18-month moat?", "PRESSURE_TEST", "Skeptical VC"),
          ],
          summary: makeField({
            strongestChallenges: ["Platform risk from Workday/ServiceNow", "Category creation requires significant market education spend", "Board-level buyer means 9-12 month sales cycles"],
            responseQuality: { 0: "Strong" },
            unresolvedVulnerabilities: ["Workday platform risk remains the primary strategic concern"],
          }, "PRESSURE_TEST", "Skeptical VC"),
        },
        {
          persona: "The Corporate Innovation Skeptic", completed: true,
          timestamp: new Date(Date.now() - 9 * 86400000).toISOString(),
          challenges: [
            makeField("When the CEO who championed AI workforce strategy gets replaced, does this tool survive the next leader's 100-day plan?", "PRESSURE_TEST", "Corporate Innovation Skeptic"),
          ],
          summary: makeField({
            strongestChallenges: ["Leadership transition resilience is unproven", "Procurement cycles for new HR tech exceed 6 months at Fortune 500"],
            responseQuality: { 0: "Adequate" },
            unresolvedVulnerabilities: ["Multi-stakeholder buy-in model needs validation beyond CHRO champion"],
          }, "PRESSURE_TEST", "Corporate Innovation Skeptic"),
        },
      ],
      pitchDeck: makeField({
        audience: "Design Partner / Potential Client",
        purpose: "Design Partner Recruitment",
        slides: [
          { slide_number: 1, title: "The Workforce Blindspot", body: "Every board is asking: 'What's our AI workforce strategy?' No CHRO has the tools to answer.", speaker_notes: "Open with the board pressure angle. Every CHRO you'll meet is getting this question quarterly.", source_citations: ["FOUNDER"] },
          { slide_number: 2, title: "The $3M PDF Problem", body: "Today's approach: hire McKinsey, get a static report, put it in a drawer. 78% of CHROs lack tools to plan for AI-augmented workforce.", speaker_notes: "Emphasize the gap between the question and available solutions.", source_citations: ["FOUNDER", "AI_RESEARCH"] },
          { slide_number: 3, title: "The Regulatory Accelerant", body: "EU AI Act requires workforce impact assessments. This isn't optional anymore.", speaker_notes: "Regulatory pressure creates urgency beyond board curiosity.", source_citations: ["FOUNDER"] },
        ],
        completeness: "3/12",
      }, "PITCH"),
      businessCase: makeField({
        status: "approved_with_conditions",
        verdict: "Approve with Conditions",
        conditions: [
          { text: "Secure 3rd design partner by end of Q1", checked: false },
          { text: "Complete prototype data ingestion pipeline", checked: true },
          { text: "Validate pricing with 5+ CHROs", checked: true },
          { text: "Hire enterprise sales lead", checked: false },
        ],
      }, "BIZ_CASE"),
      designPartners: [
        {
          id: "dp1",
          company: makeField("Meridian Insurance Group", "VL"),
          contact: makeField("Jennifer Walsh, CHRO", "VL"),
          industry: makeField("Insurance", "VL"),
          size: makeField("12,000 employees, $4.2B revenue", "VL"),
          interest: makeField("Hot", "VL"),
          stage: makeField("Signed", "VL"),
          score: makeField({
            scores: { "ICP Match": 5, "Pain Acuteness": 5, "Willingness to Pay": 4, "Decision Authority": 5, "Data & Access": 4, "Referencability": 5, "Strategic Fit": 5, "Engagement Enthusiasm": 5 },
            total: 38,
            verdict: "Strong Candidate",
            recommendation: "Ideal first design partner. CHRO has board mandate and budget authority. Insurance industry facing massive AI-driven claims automation — urgency is real.",
          }, "SCORING", "Design Partner"),
          notes: [makeField("Jennifer confirmed budget allocation for Q1. Wants to model claims processing automation impact on 3,000 person operations team.", "VL")],
        },
        {
          id: "dp2",
          company: makeField("Hartwell & Associates (Big 4)", "VL"),
          contact: makeField("David Kim, SVP Workforce Strategy", "VL"),
          industry: makeField("Professional Services", "VL"),
          size: makeField("45,000 employees, $18B revenue", "VL"),
          interest: makeField("Hot", "VL"),
          stage: makeField("Signed", "VL"),
          score: makeField({
            scores: { "ICP Match": 4, "Pain Acuteness": 4, "Willingness to Pay": 5, "Decision Authority": 4, "Data & Access": 3, "Referencability": 5, "Strategic Fit": 4, "Engagement Enthusiasm": 4 },
            total: 33,
            verdict: "Strong Candidate",
            recommendation: "Exceptional referencability — a Big 4 firm using the tool validates the category. Data access may require additional security review. Proceed with dedicated data governance workstream.",
          }, "SCORING", "Design Partner"),
          notes: [makeField("David's team is modeling impact of AI on audit workforce. Wants scenario planning for 3-year horizon.", "VL")],
        },
        {
          id: "dp3",
          company: makeField("NovaCare Health Systems", "VL"),
          contact: makeField("Rachel Simmons, CHRO", "VL"),
          industry: makeField("Healthcare Admin", "VL"),
          size: makeField("8,500 employees, $2.1B revenue", "VL"),
          interest: makeField("Warm", "VL"),
          stage: makeField("Conversation", "VL"),
          score: makeField({
            scores: { "ICP Match": 4, "Pain Acuteness": 3, "Willingness to Pay": 3, "Decision Authority": 4, "Data & Access": 3, "Referencability": 4, "Strategic Fit": 3, "Engagement Enthusiasm": 3 },
            total: 27,
            verdict: "Conditional",
            recommendation: "Good ICP match but lower urgency than other candidates. Healthcare admin is a strong vertical but Rachel needs internal alignment with CIO before committing. Follow up in 2 weeks.",
          }, "SCORING", "Design Partner"),
          notes: [makeField("Initial call went well but Rachel mentioned CIO skepticism about sharing workforce data externally. Needs internal sell.", "VL")],
        },
      ],
      weeklyNotes: makeField("Strong momentum. Two design partners signed and delivering data. Third partner (NovaCare) needs a push — considering offering a reduced-scope pilot.", "VL"),
    },

    ledgerlens: {
      id: "ledgerlens",
      name: makeField("LedgerLens", "VL"),
      stage: makeField("06", "VL"),
      founder: makeField("Alex Petrov", "VL"),
      status: makeField("On Track", "VL"),
      description: makeField(
        "AI-powered financial disclosure compliance validation tool for mid-market CFOs preparing for audit. Catches errors, inconsistencies, and compliance gaps before the auditors do.",
        "FOUNDER"
      ),
      interview: {
        completed: true,
        sections: {
          "The Idea": makeField("A compliance validation layer that sits between the finance team's disclosure drafts and the auditor review. Uses AI to cross-reference financials, footnotes, MD&A, and regulatory requirements — flagging errors, inconsistencies, and gaps before the audit team ever sees them. Origin: Alex spent 8 years in audit at KPMG and watched the same preventable errors delay engagements quarter after quarter.", "FOUNDER"),
          "Pain Points & Problem Depth": makeField("Mid-market companies ($500M-$5B revenue) spend $2-4M annually on audit preparation. 60% of first-round audit findings are preventable disclosure errors — wrong cross-references, stale footnotes, missing required disclosures. Each finding costs 40-80 hours to remediate. CFOs hate the audit process because it's adversarial and expensive. No tool exists to pre-validate disclosures before auditors arrive.", "FOUNDER"),
          "Ideal Customer Profile": makeField("Mid-market companies ($500M-$5B revenue), publicly traded or PE-backed requiring audited financials. Buyer: Controller or VP of Financial Reporting. Decision unit: CFO + Controller. Company profile: 3-10 person financial reporting team overwhelmed by disclosure volume.", "FOUNDER"),
          "The Solution": makeField("Ingests disclosure drafts (10-K, 10-Q, annual reports), cross-references against GAAP/IFRS requirements, prior period filings, and internal financial data. Produces a validation report ranking issues by severity (Critical/High/Medium/Low) with specific remediation guidance. Does NOT prepare disclosures — validates them. Does NOT replace the auditor — reduces friction with them.", "FOUNDER"),
          "Revenue Model": makeField("Annual SaaS: $100K for mid-market, $250K for large enterprise. Quarterly validation cycle aligns with reporting cadence. 90% gross margin at scale. Unit economics: replaces $500K-$1M in remediation costs and consultant hours per client per year.", "FOUNDER"),
          "Why Now": makeField("(1) SEC enforcement actions up 30% in 2024 — regulatory scrutiny intensifying. (2) LLMs can now parse complex financial documents and cross-reference at scale. (3) PCAOB pushing for more standardized audit evidence — pre-validated disclosures reduce auditor workload. (4) ESG/climate disclosure requirements doubling the disclosure surface area.", "FOUNDER"),
          "Team & Founder Fit": makeField("Alex Petrov — 8 years KPMG Audit (Senior Manager), 3 years at Workiva (product team, disclosure management). CTO: Nina Cheng — ex-Bloomberg, built financial data parsing systems. Head of Sales: Tom Bradley — ex-Workiva enterprise sales, $5M+ quota carrier. Advisory: Former PCAOB board member.", "FOUNDER"),
          "Traction & Evidence": makeField("3 signed design partners completed validation pilots. 2 converting to paid ($100K contracts). Pipeline of 15 companies from KPMG audit partner referrals. $200K in committed ARR. Featured in CFO.com article on AI in audit prep.", "FOUNDER"),
        },
      },
      scoring: {
        corporate: makeField({
          scores: { "Strategic Alignment": 5, "Horizon Classification": 3, "Internal Sponsorship": 5, "Organizational Readiness": 4, "Innovation Type": 3, "Cannibalization Risk": 2, "Build/Buy/Partner Fit": 5 },
          horizon: "H1/H2",
          recommendation: "Highest strategic alignment in portfolio. Direct extension of KPMG Audit practice with clear distribution advantage. Some cannibalization risk with manual audit preparation services — needs careful positioning as 'audit enhancement' not 'audit replacement.'",
        }, "SCORING", "Corporate Innovation"),
        vc: makeField({
          scores: { "Market Size": 4, "Problem Severity": 5, "Solution Differentiation": 4, "Founder-Market Fit": 5, "Business Model Quality": 5, "Timing/Why Now": 5, "Competitive Moat": 4, "Traction Signal": 5 },
          fundability: "Strong",
          assessment: "Exceptional founder-market fit — audit insider building for auditors. Strong early traction with paid conversion. Timing is ideal with SEC enforcement surge and new disclosure requirements. Most fundable venture in current portfolio.",
        }, "SCORING", "VC Lens"),
        studio: makeField({
          scores: { "Design Partner Readiness": 5, "Prototype-ability": 5, "Studio Unfair Advantage": 5, "Stage-Gate Progressibility": 5, "Founder Accountability": 5, "Capital Efficiency": 5, "Exit Path Clarity": 5, "Client Validation Signal": 5 },
          recommendation: "Incubate",
          assessment: "Model venture for the studio. Clear design partner validation, strong unit economics, and unmatched studio distribution advantage through KPMG Audit. Fastest path to commercial validation in current portfolio.",
        }, "SCORING", "Studio Lens"),
      },
      compositeSignal: makeField("Advance", "SCORING"),
      pressureTests: [
        {
          persona: "The Skeptical VC", completed: true,
          timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
          challenges: [makeField("Workiva has 4,000+ customers in exactly this space. How are you not just a feature they ship next quarter?", "PRESSURE_TEST", "Skeptical VC")],
          summary: makeField({ strongestChallenges: ["Workiva platform risk"], responseQuality: { 0: "Strong" }, unresolvedVulnerabilities: [] }, "PRESSURE_TEST", "Skeptical VC"),
        },
      ],
      pitchDeck: makeField({
        audience: "Studio Investment Committee",
        purpose: "Stage Gate Advancement",
        slides: [
          { slide_number: 1, title: "The $2B Error", body: "60% of first-round audit findings are preventable. Mid-market companies spend $2-4M annually on audit prep that still fails.", speaker_notes: "Lead with the cost of the problem.", source_citations: ["FOUNDER", "AI_RESEARCH"] },
        ],
        completeness: "12/12",
      }, "PITCH"),
      businessCase: makeField({
        status: "approved",
        verdict: "Approve",
        conditions: [],
      }, "BIZ_CASE"),
      designPartners: [
        { id: "ldp1", company: makeField("Cascade Manufacturing", "VL"), contact: makeField("CFO", "VL"), industry: makeField("Manufacturing", "VL"), size: makeField("$1.2B revenue", "VL"), interest: makeField("Hot", "VL"), stage: makeField("Signed", "VL"), score: makeField({ total: 36, verdict: "Strong Candidate" }, "SCORING", "Design Partner"), notes: [] },
        { id: "ldp2", company: makeField("Pacific Financial Group", "VL"), contact: makeField("Controller", "VL"), industry: makeField("Financial Services", "VL"), size: makeField("$3.4B AUM", "VL"), interest: makeField("Hot", "VL"), stage: makeField("Signed", "VL"), score: makeField({ total: 35, verdict: "Strong Candidate" }, "SCORING", "Design Partner"), notes: [] },
        { id: "ldp3", company: makeField("Vertex Health Partners", "VL"), contact: makeField("VP Financial Reporting", "VL"), industry: makeField("Healthcare", "VL"), size: makeField("$800M revenue", "VL"), interest: makeField("Hot", "VL"), stage: makeField("Signed", "VL"), score: makeField({ total: 34, verdict: "Strong Candidate" }, "SCORING", "Design Partner"), notes: [] },
      ],
      weeklyNotes: makeField("MVP build on track. Sprint 3 completing this week — core validation engine processing 10-K filings with 94% accuracy. Two design partners converting to paid contracts.", "VL"),
    },
  };
  return ventures;
}

// ─── App Context ─────────────────────────────────────────────────────────────
const AppContext = createContext(null);

// ─── Radar Chart Component (pure SVG) ────────────────────────────────────────
function RadarChart({ data, labels, color = "#7C6AF7", size = 200 }) {
  const center = size / 2;
  const radius = size / 2 - 30;
  const n = labels.length;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i, val) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (val / 5) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridLevels = [1, 2, 3, 4, 5];
  const dataPoints = labels.map((_, i) => getPoint(i, data[i] || 0));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLevels.map((level) => {
        const pts = labels.map((_, i) => getPoint(i, level));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        return <path key={level} d={path} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity={0.5} />;
      })}
      {labels.map((_, i) => {
        const end = getPoint(i, 5);
        return <line key={i} x1={center} y1={center} x2={end.x} y2={end.y} stroke="var(--border)" strokeWidth="0.5" opacity={0.3} />;
      })}
      <path d={dataPath} fill={`${color}25`} stroke={color} strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
      {labels.map((label, i) => {
        const p = getPoint(i, 5.8);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize="8" fontFamily="'IBM Plex Mono', monospace">
            {label.length > 12 ? label.slice(0, 11) + "…" : label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Loading / Skeleton ──────────────────────────────────────────────────────
function LoadingDots({ message }) {
  return (
    <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
      <div className="dot-pulse flex gap-1">
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", display: "inline-block" }} />
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", display: "inline-block" }} />
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", display: "inline-block" }} />
      </div>
      <span className="font-mono" style={{ fontSize: "12px" }}>{message}</span>
    </div>
  );
}

function Skeleton({ width = "100%", height = "20px" }) {
  return (
    <div
      style={{ width, height, background: "var(--border)", borderRadius: 6, opacity: 0.5 }}
      className="animate-pulse"
    />
  );
}

// ─── Navigation ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "interview", label: "Founder Interview" },
  { id: "pressure", label: "Pressure Test" },
  { id: "pitchdeck", label: "Pitch Deck" },
  { id: "bizcase", label: "Business Case" },
  { id: "designpartners", label: "Design Partners" },
  { id: "portfolio", label: "Portfolio Report" },
];

function TopNav({ activeView, setActiveView, activeVenture, ventures, onGenerateReport }) {
  const v = activeVenture ? ventures[activeVenture] : null;
  return (
    <header
      className="flex items-center justify-between px-6"
      style={{ height: 56, background: "rgba(19,17,28,0.95)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}
    >
      <div className="flex items-center gap-6">
        <span className="font-heading font-bold" style={{ fontSize: 18, color: "var(--accent-primary)", letterSpacing: "-0.02em" }}>
          Venture OS
        </span>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className="px-3 py-1.5 rounded-md font-heading"
              style={{
                fontSize: 12,
                fontWeight: activeView === item.id ? 600 : 400,
                color: activeView === item.id ? "var(--text-primary)" : "var(--text-muted)",
                background: activeView === item.id ? "rgba(124,106,247,0.12)" : "transparent",
                border: "none",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {v && (
          <div className="flex items-center gap-2">
            <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{v.name.value}</span>
            <StageBadge stageId={v.stage.value} small />
          </div>
        )}
        <button
          onClick={onGenerateReport}
          className="px-3 py-1.5 rounded-md font-heading"
          style={{ fontSize: 12, fontWeight: 600, color: "#F0EEFF", background: "var(--accent-primary)", border: "none" }}
        >
          Generate Weekly Report
        </button>
      </div>
    </header>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ ventures, setActiveVenture, setActiveView }) {
  const ventureList = Object.values(ventures);
  const stageGroups = STAGES.map((s) => ({
    ...s,
    ventures: ventureList.filter((v) => v.stage.value === s.id),
  }));

  return (
    <div className="p-6 h-full overflow-auto scrollbar-thin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold" style={{ fontSize: 24 }}>Studio Pipeline</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{ventureList.length} active ventures across {new Set(ventureList.map((v) => v.stage.value)).size} stages</p>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {stageGroups.map((sg) => (
          <div key={sg.id} className="flex-shrink-0" style={{ width: 280 }}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <StageBadge stageId={sg.id} small />
              <span className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {sg.ventures.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {sg.ventures.map((v) => (
                <div
                  key={v.id}
                  className="glass-card glass-card-hover p-4 cursor-pointer animate-fadeIn"
                  onClick={() => { setActiveVenture(v.id); setActiveView("ventureDetail"); }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-heading font-semibold" style={{ fontSize: 14 }}>{v.name.value}</span>
                    <StatusChip status={v.status.value} />
                  </div>
                  <p className="font-mono mb-3" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {v.description.value.slice(0, 100)}...
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <SourceChip source="FOUNDER" small />
                    {v.scoring?.corporate && <SourceChip source="SCORING" subSource="Corp" small />}
                    {v.pitchDeck && <SourceChip source="PITCH" small />}
                  </div>
                  <div className="flex items-center justify-between mt-3" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                    <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>Founder: {v.founder.value}</span>
                    {v.compositeSignal && (
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: v.compositeSignal.value === "Advance" ? "#10B981" : v.compositeSignal.value === "Caution" ? "#F59E0B" : "#EF4444",
                        }}
                      >
                        {v.compositeSignal.value}
                      </span>
                    )}
                  </div>
                  {v.stage.value === "04" && v.designPartners && (
                    <div className="mt-2 font-mono" style={{ fontSize: 10, color: "var(--accent-secondary)" }}>
                      Design Partners: {v.designPartners.filter((d) => d.stage.value === "Signed").length}/3 signed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Venture Detail ──────────────────────────────────────────────────────────
function VentureDetail({ venture, setVentures, ventures }) {
  const [tab, setTab] = useState("overview");
  if (!venture) return null;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "scoring", label: "Scoring" },
    { id: "pressure", label: "Pressure Tests" },
    { id: "bizcase", label: "Business Case" },
    { id: "designpartners", label: "Design Partners" },
    { id: "pitch", label: "Pitch Deck" },
    { id: "audit", label: "Source Audit" },
  ];

  return (
    <div className="p-6 h-full overflow-auto scrollbar-thin">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="font-heading font-bold" style={{ fontSize: 24 }}>{venture.name.value}</h1>
        <StageBadge stageId={venture.stage.value} />
        <StatusChip status={venture.status.value} />
        {venture.compositeSignal && (
          <span className="font-mono px-2 py-1 rounded" style={{
            fontSize: 11,
            background: venture.compositeSignal.value === "Advance" ? "#10B98118" : "#F59E0B18",
            color: venture.compositeSignal.value === "Advance" ? "#10B981" : "#F59E0B",
            border: `1px solid ${venture.compositeSignal.value === "Advance" ? "#10B98140" : "#F59E0B40"}`,
          }}>
            Signal: {venture.compositeSignal.value}
          </span>
        )}
      </div>

      <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 font-heading"
            style={{
              fontSize: 12,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "var(--accent-primary)" : "var(--text-muted)",
              borderBottom: tab === t.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
              background: "transparent",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <VentureOverview venture={venture} />}
      {tab === "scoring" && <VentureScoring venture={venture} />}
      {tab === "pressure" && <VenturePressureTests venture={venture} />}
      {tab === "bizcase" && <VentureBusinessCase venture={venture} />}
      {tab === "designpartners" && <VentureDesignPartners venture={venture} />}
      {tab === "pitch" && <VenturePitchDeck venture={venture} />}
      {tab === "audit" && <VentureAudit venture={venture} />}
    </div>
  );
}

function VentureOverview({ venture }) {
  const sections = venture.interview?.sections || {};
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-heading font-semibold" style={{ fontSize: 14 }}>Description</span>
          <SourceChip source={venture.description.source} small />
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{venture.description.value}</p>
      </div>

      <div className="glass-card p-4">
        <span className="font-heading font-semibold" style={{ fontSize: 14 }}>Venture Lead Notes</span>
        <p className="mt-2" style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {venture.weeklyNotes?.value}
        </p>
        <SourceChip source="VL" small />
      </div>

      <div>
        <h3 className="font-heading font-semibold mb-3" style={{ fontSize: 16 }}>Interview Responses</h3>
        {Object.entries(sections).map(([section, field]) => (
          <div key={section} className="glass-card p-4 mb-3 animate-slideIn">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-heading font-medium" style={{ fontSize: 13 }}>{section}</span>
              <SourceChip source={field.source} subSource={field.subSource} small />
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VentureScoring({ venture }) {
  const [lens, setLens] = useState("corporate");
  const lenses = [
    { id: "corporate", label: "Corporate Innovation", key: "corporate" },
    { id: "vc", label: "VC Lens", key: "vc" },
    { id: "studio", label: "Studio Lens", key: "studio" },
  ];

  const currentData = venture.scoring?.[lens]?.value;
  if (!currentData) return <p style={{ color: "var(--text-muted)" }}>No scoring data available.</p>;

  const scores = currentData.scores || {};
  const labels = Object.keys(scores);
  const values = Object.values(scores);
  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "—";

  return (
    <div className="animate-fadeIn">
      <div className="flex gap-2 mb-4">
        {lenses.map((l) => (
          <button
            key={l.id}
            onClick={() => setLens(l.id)}
            className="px-3 py-1.5 rounded-md font-heading"
            style={{
              fontSize: 12,
              fontWeight: lens === l.id ? 600 : 400,
              color: lens === l.id ? "var(--text-primary)" : "var(--text-muted)",
              background: lens === l.id ? "rgba(124,106,247,0.15)" : "transparent",
              border: `1px solid ${lens === l.id ? "var(--accent-primary)" : "var(--border)"}`,
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 flex flex-col items-center">
          <RadarChart data={values} labels={labels} color={lens === "corporate" ? "#7C6AF7" : lens === "vc" ? "#4F9CF9" : "#10B981"} size={240} />
          <div className="font-mono mt-2" style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-primary)" }}>
            Avg: {avg}/5
          </div>
          <SourceChip source="SCORING" subSource={venture.scoring[lens]?.subSource} small />
        </div>
        <div className="glass-card p-4">
          <h4 className="font-heading font-semibold mb-3" style={{ fontSize: 14 }}>Dimension Scores</h4>
          {labels.map((label, i) => (
            <div key={label} className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
              <div className="flex items-center gap-2">
                <div style={{ width: 80, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${(values[i] / 5) * 100}%`, height: "100%", background: "var(--accent-primary)", borderRadius: 2 }} />
                </div>
                <span className="font-mono" style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 600 }}>{values[i]}</span>
              </div>
            </div>
          ))}
          <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(124,106,247,0.08)" }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {currentData.recommendation || currentData.assessment}
            </p>
          </div>
          {currentData.fundability && (
            <div className="mt-2 font-mono" style={{ fontSize: 11, color: currentData.fundability === "Strong" ? "#10B981" : "#F59E0B" }}>
              Fundability: {currentData.fundability}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VenturePressureTests({ venture }) {
  if (!venture.pressureTests?.length)
    return <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No pressure tests completed yet.</p>;

  return (
    <div className="space-y-4 animate-fadeIn">
      {venture.pressureTests.map((pt, idx) => (
        <div key={idx} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-heading font-semibold" style={{ fontSize: 14 }}>{pt.persona}</span>
            <SourceChip source="PRESSURE_TEST" subSource={pt.persona.split(" ").slice(-2).join(" ")} small />
            <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
              {new Date(pt.timestamp).toLocaleDateString()}
            </span>
          </div>
          {pt.challenges.map((c, ci) => (
            <div key={ci} className="mb-2 p-3 rounded-lg" style={{ background: "rgba(249,115,22,0.06)", borderLeft: "2px solid var(--accent-warning)" }}>
              <p style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6 }}>{c.value}</p>
              {pt.summary?.value?.responseQuality?.[ci] && (
                <span className="font-mono mt-1 inline-block" style={{
                  fontSize: 10,
                  color: pt.summary.value.responseQuality[ci] === "Strong" ? "#10B981" : pt.summary.value.responseQuality[ci] === "Weak" ? "#EF4444" : "#F59E0B",
                }}>
                  Response: {pt.summary.value.responseQuality[ci]}
                </span>
              )}
            </div>
          ))}
          {pt.summary?.value?.unresolvedVulnerabilities?.length > 0 && (
            <div className="mt-3">
              <span className="font-heading font-medium" style={{ fontSize: 12, color: "#EF4444" }}>Unresolved Vulnerabilities:</span>
              {pt.summary.value.unresolvedVulnerabilities.map((v, vi) => (
                <p key={vi} className="font-mono ml-3 mt-1" style={{ fontSize: 11, color: "var(--text-muted)" }}>• {v}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VentureBusinessCase({ venture }) {
  const bc = venture.businessCase?.value;
  if (!bc) return <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No business case generated yet.</p>;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-heading font-semibold" style={{ fontSize: 16 }}>Investment Business Case</span>
        <SourceChip source="BIZ_CASE" small />
        <span
          className="font-mono px-2 py-1 rounded"
          style={{
            fontSize: 11,
            background: bc.verdict === "Approve" ? "#10B98118" : "#F59E0B18",
            color: bc.verdict === "Approve" ? "#10B981" : "#F59E0B",
            border: `1px solid ${bc.verdict === "Approve" ? "#10B98140" : "#F59E0B40"}`,
          }}
        >
          {bc.verdict}
        </span>
      </div>

      {bc.sections && Object.entries(bc.sections).map(([key, sec]) => (
        <div key={key} className="glass-card p-4 mb-3">
          <h4 className="font-heading font-semibold mb-2" style={{ fontSize: 13 }}>{key}</h4>
          {sec.content ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>{sec.content}</p>
          ) : (
            <div className="p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="font-mono" style={{ fontSize: 11, color: "#F59E0B" }}>⚠ Gap Alert: {sec.gap_alerts?.[0]}</span>
            </div>
          )}
          {sec.source_citations?.length > 0 && (
            <div className="flex gap-1 mt-2">
              {sec.source_citations.map((s, i) => <SourceChip key={i} source={s} small />)}
            </div>
          )}
        </div>
      ))}

      {bc.conditions?.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="font-heading font-semibold mb-3" style={{ fontSize: 13 }}>Conditions Tracker</h4>
          {bc.conditions.map((c, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <div
                style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `1px solid ${c.checked ? "#10B981" : "var(--border)"}`,
                  background: c.checked ? "#10B98118" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#10B981",
                }}
              >
                {c.checked ? "✓" : ""}
              </div>
              <span style={{ fontSize: 12, color: c.checked ? "var(--text-muted)" : "var(--text-primary)", textDecoration: c.checked ? "line-through" : "none" }}>
                {c.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VentureDesignPartners({ venture }) {
  if (!venture.designPartners?.length)
    return <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No design partners tracked yet.</p>;

  const signed = venture.designPartners.filter((d) => d.stage.value === "Signed").length;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-heading font-semibold" style={{ fontSize: 16 }}>Design Partner Pipeline</span>
        <span className="font-mono px-2 py-1 rounded" style={{
          fontSize: 11,
          background: signed >= 3 ? "#10B98118" : "#F59E0B18",
          color: signed >= 3 ? "#10B981" : "#F59E0B",
          border: `1px solid ${signed >= 3 ? "#10B98140" : "#F59E0B40"}`,
        }}>
          {signed}/3 Signed
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {venture.designPartners.map((dp) => (
          <div key={dp.id} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold" style={{ fontSize: 14 }}>{dp.company.value}</span>
                <SourceChip source="DESIGN_PARTNER" subSource={dp.company.value.split(" ")[0]} small />
              </div>
              <span
                className="font-mono px-2 py-1 rounded"
                style={{
                  fontSize: 10,
                  background: dp.stage.value === "Signed" ? "#10B98118" : dp.stage.value === "Conversation" ? "#4F9CF918" : "#8B87A818",
                  color: dp.stage.value === "Signed" ? "#10B981" : dp.stage.value === "Conversation" ? "#4F9CF9" : "#8B87A8",
                  border: `1px solid ${dp.stage.value === "Signed" ? "#10B98140" : "var(--border)"}`,
                }}
              >
                {dp.stage.value}
              </span>
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {dp.contact.value} · {dp.industry.value} · {dp.size.value}
            </div>
            {dp.score?.value && (
              <div className="flex items-center gap-3 mt-2">
                <span className="font-mono" style={{ fontSize: 11, color: "var(--accent-primary)" }}>
                  Score: {dp.score.value.total}/40
                </span>
                <span className="font-mono" style={{
                  fontSize: 10,
                  color: dp.score.value.verdict === "Strong Candidate" ? "#10B981" : "#F59E0B",
                }}>
                  {dp.score.value.verdict}
                </span>
              </div>
            )}
            {dp.score?.value?.recommendation && (
              <p className="mt-2" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>{dp.score.value.recommendation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function VenturePitchDeck({ venture }) {
  const pd = venture.pitchDeck?.value;
  if (!pd) return <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No pitch deck generated yet.</p>;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-heading font-semibold" style={{ fontSize: 16 }}>Pitch Deck</span>
        <SourceChip source="PITCH" small />
        <span className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {pd.audience} · {pd.purpose} · {pd.completeness}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {pd.slides?.map((slide) => (
          <div key={slide.slide_number} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono" style={{ fontSize: 11, color: "var(--accent-primary)", fontWeight: 600 }}>
                Slide {String(slide.slide_number).padStart(2, "0")}
              </span>
              <span className="font-heading font-semibold" style={{ fontSize: 14 }}>{slide.title}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{slide.body}</p>
            {slide.speaker_notes && (
              <div className="mt-2 p-2 rounded" style={{ background: "rgba(124,106,247,0.06)" }}>
                <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>Speaker Notes: </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{slide.speaker_notes}</span>
              </div>
            )}
            {slide.source_citations && (
              <div className="flex gap-1 mt-2">
                {slide.source_citations.map((s, i) => <SourceChip key={i} source={s} small />)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function VentureAudit({ venture }) {
  const allFields = [];
  const addField = (name, field) => {
    if (field && field.value !== undefined) {
      allFields.push({ name, ...field });
    }
  };

  addField("Name", venture.name);
  addField("Stage", venture.stage);
  addField("Status", venture.status);
  addField("Founder", venture.founder);
  addField("Description", venture.description);
  addField("Composite Signal", venture.compositeSignal);
  addField("Weekly Notes", venture.weeklyNotes);

  if (venture.interview?.sections) {
    Object.entries(venture.interview.sections).forEach(([k, v]) => addField(`Interview: ${k}`, v));
  }

  return (
    <div className="animate-fadeIn">
      <h3 className="font-heading font-semibold mb-4" style={{ fontSize: 16 }}>Source Audit Log</h3>
      <div className="glass-card overflow-hidden">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Field", "Value", "Source", "Timestamp"].map((h) => (
                <th key={h} className="font-mono text-left px-4 py-2" style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFields.map((f, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-2 font-mono" style={{ fontSize: 11, color: "var(--text-primary)" }}>{f.name}</td>
                <td className="px-4 py-2" style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {typeof f.value === "object" ? JSON.stringify(f.value).slice(0, 60) + "…" : String(f.value).slice(0, 80)}
                </td>
                <td className="px-4 py-2"><SourceChip source={f.source} subSource={f.subSource} small /></td>
                <td className="px-4 py-2 font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {f.timestamp ? new Date(f.timestamp).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Founder Interview Mode ──────────────────────────────────────────────────
const INTERVIEW_SECTIONS = [
  "The Idea", "Pain Points & Problem Depth", "Ideal Customer Profile", "The Solution",
  "Revenue Model", "Why Now", "Team & Founder Fit", "Traction & Evidence",
];

const INTERVIEW_SYSTEM = `You are a sharp, intellectually rigorous venture lead conducting a structured intake interview with a founder. Your job is to extract specific, evidence-backed answers — not polished narratives. Push back on vague claims. Ask for numbers, names, and concrete examples. Be direct but not hostile. Move through sections systematically but adapt your follow-ups based on what you hear. When the founder gives a strong answer, acknowledge it briefly and move on. When they're vague, probe harder before advancing. Never ask more than one question at a time.

You are currently in the section: "{section}". Ask focused questions about this topic. When you have enough detail for this section, say "[SECTION_COMPLETE]" at the end of your message to signal readiness to move to the next section.

Previous interview context:
{context}`;

function FounderInterview({ ventures, setVentures, activeVenture, setActiveVenture }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [ventureName, setVentureName] = useState("");
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sectionResponses, setSectionResponses] = useState({});
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const startInterview = async () => {
    if (!ventureName.trim()) return;
    setStarted(true);
    setLoading(true);
    try {
      const resp = await callClaude(
        INTERVIEW_SYSTEM.replace("{section}", INTERVIEW_SECTIONS[0]).replace("{context}", "This is the beginning of the interview."),
        `The founder wants to discuss a venture called "${ventureName}". Begin the interview by asking about The Idea — the concept, the problem they're solving, and where the insight came from. Ask one question.`
      );
      setMessages([{ role: "assistant", content: resp, source: "AI_SYNTHESIS", section: INTERVIEW_SECTIONS[0] }]);
    } catch (e) {
      setMessages([{ role: "assistant", content: "I'd love to hear about your venture. What problem are you solving, and where did the insight come from?", source: "AI_SYNTHESIS", section: INTERVIEW_SECTIONS[0] }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input, source: "FOUNDER", section: INTERVIEW_SECTIONS[currentSection], timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Track responses per section
    setSectionResponses((prev) => ({
      ...prev,
      [INTERVIEW_SECTIONS[currentSection]]: (prev[INTERVIEW_SECTIONS[currentSection]] || "") + " " + input,
    }));

    const context = messages.map((m) => `[${m.role === "assistant" ? "Interviewer" : "Founder"}]: ${m.content}`).join("\n");

    try {
      const resp = await callClaude(
        INTERVIEW_SYSTEM.replace("{section}", INTERVIEW_SECTIONS[currentSection]).replace("{context}", context),
        input
      );

      const sectionComplete = resp.includes("[SECTION_COMPLETE]");
      const cleanResp = resp.replace("[SECTION_COMPLETE]", "").trim();

      if (sectionComplete && currentSection < INTERVIEW_SECTIONS.length - 1) {
        setCurrentSection((prev) => prev + 1);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: cleanResp, source: "AI_SYNTHESIS", section: INTERVIEW_SECTIONS[currentSection] },
        ]);
      } else if (sectionComplete && currentSection >= INTERVIEW_SECTIONS.length - 1) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: cleanResp + "\n\nInterview complete! Your venture has been recorded.", source: "AI_SYNTHESIS", section: INTERVIEW_SECTIONS[currentSection] },
        ]);
        // Save venture
        const newVenture = {
          id: ventureName.toLowerCase().replace(/\s+/g, ""),
          name: makeField(ventureName, "FOUNDER"),
          stage: makeField("01", "VL"),
          founder: makeField("You", "VL"),
          status: makeField("On Track", "VL"),
          description: makeField(sectionResponses["The Idea"] || input, "FOUNDER"),
          interview: {
            completed: true,
            sections: Object.fromEntries(
              INTERVIEW_SECTIONS.map((s) => [s, makeField(sectionResponses[s] || "Pending", "FOUNDER")])
            ),
          },
          scoring: {},
          compositeSignal: null,
          pressureTests: [],
          pitchDeck: null,
          businessCase: null,
          designPartners: [],
          weeklyNotes: makeField("", "VL"),
        };
        setVentures((prev) => ({ ...prev, [newVenture.id]: newVenture }));
        setActiveVenture(newVenture.id);
        setCompleted(true);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: cleanResp, source: "AI_SYNTHESIS", section: INTERVIEW_SECTIONS[currentSection] },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I apologize — I had trouble processing that. Could you repeat your last point?", source: "AI_SYNTHESIS", section: INTERVIEW_SECTIONS[currentSection] },
      ]);
    }
    setLoading(false);
  };

  if (!started) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="glass-card p-8 text-center" style={{ maxWidth: 480 }}>
          <h2 className="font-heading font-bold mb-2" style={{ fontSize: 22 }}>Founder Interview</h2>
          <p className="mb-6" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Start a structured intake interview. Claude will guide you through 8 sections to capture your venture's key details.
          </p>
          <input
            type="text"
            value={ventureName}
            onChange={(e) => setVentureName(e.target.value)}
            placeholder="Venture name..."
            className="w-full mb-4"
            style={{ fontSize: 14, padding: "10px 14px" }}
            onKeyDown={(e) => e.key === "Enter" && startInterview()}
          />
          <button
            onClick={startInterview}
            className="w-full py-2.5 rounded-lg font-heading font-semibold"
            style={{ fontSize: 14, background: "var(--accent-primary)", color: "#fff", border: "none" }}
          >
            Begin Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Section tracker */}
      <div className="px-6 py-3 flex items-center gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)", background: "rgba(19,17,28,0.5)" }}>
        {INTERVIEW_SECTIONS.map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap"
            style={{
              fontSize: 10,
              fontFamily: "'IBM Plex Mono', monospace",
              background: i === currentSection ? "rgba(124,106,247,0.15)" : i < currentSection ? "rgba(16,185,129,0.1)" : "transparent",
              color: i === currentSection ? "var(--accent-primary)" : i < currentSection ? "#10B981" : "var(--text-muted)",
              border: `1px solid ${i === currentSection ? "var(--accent-primary)" : "transparent"}`,
            }}
          >
            {i < currentSection ? "✓" : `${i + 1}`} {s}
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-auto p-6 space-y-4 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"} animate-fadeIn`}>
            <div
              className="rounded-xl px-4 py-3"
              style={{
                maxWidth: "70%",
                background: msg.role === "assistant" ? "rgba(124,106,247,0.1)" : "rgba(30,26,46,0.8)",
                border: `1px solid ${msg.role === "assistant" ? "rgba(124,106,247,0.2)" : "var(--border)"}`,
              }}
            >
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{msg.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <SourceChip source={msg.source} small />
                <span className="font-mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>{msg.section}</span>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)" }}>
              <LoadingDots message="Preparing next question..." />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {!completed && (
        <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border)", background: "rgba(19,17,28,0.5)" }}>
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share your response..."
              className="flex-1"
              rows={2}
              style={{ fontSize: 13 }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 rounded-lg font-heading font-semibold self-end"
              style={{
                height: 40,
                fontSize: 13,
                background: loading || !input.trim() ? "var(--border)" : "var(--accent-primary)",
                color: "#fff",
                border: "none",
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shark Tank Pressure Test ────────────────────────────────────────────────
const PERSONAS = [
  { id: "skeptical_vc", name: "The Skeptical VC", archetype: "Marc Andreessen archetype", color: "#EF4444", focus: "Market size, vitamin vs. painkiller, incumbent threat" },
  { id: "corp_skeptic", name: "The Corporate Innovation Skeptic", archetype: "Fortune 500 CSO", color: "#F59E0B", focus: "Procurement survival, leadership resilience, internal politics" },
  { id: "design_partner", name: "The Demanding Design Partner", archetype: "First paying customer", color: "#4F9CF9", focus: "Vendor displacement, 90-day success, data access" },
  { id: "tech_advocate", name: "The Technical Devil's Advocate", archetype: "CTO / Engineering Lead", color: "#0EA5E9", focus: "Technical moat, commodity AI risk, data privacy" },
  { id: "unit_econ", name: "The Unit Economics Enforcer", archetype: "Growth-stage CFO", color: "#10B981", focus: "Unit economics, payback period, P&L at scale" },
  { id: "studio_insider", name: "The Venture Studio Insider", archetype: "Experienced studio operator", color: "#7C6AF7", focus: "Studio-vs-acquisition, parent dependency, exit path" },
];

function PressureTest({ ventures, setVentures, activeVenture }) {
  const venture = ventures[activeVenture];
  const [selectedPersonas, setSelectedPersonas] = useState([]);
  const [activePersona, setActivePersona] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  if (!venture) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center" style={{ maxWidth: 400 }}>
          <h2 className="font-heading font-bold mb-2" style={{ fontSize: 20 }}>Pressure Test</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Select a venture from the Dashboard first.</p>
        </div>
      </div>
    );
  }

  if (!venture.interview?.completed) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center" style={{ maxWidth: 400 }}>
          <h2 className="font-heading font-bold mb-2" style={{ fontSize: 20 }}>Pressure Test</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Complete the Founder Interview for {venture.name.value} first.</p>
        </div>
      </div>
    );
  }

  const ventureContext = Object.entries(venture.interview?.sections || {})
    .map(([k, v]) => `${k}: ${v.value}`)
    .join("\n\n");

  const startSession = async (persona) => {
    setActivePersona(persona);
    setSessionStarted(true);
    setMessages([]);
    setLoading(true);
    const systemPrompt = `You are ${persona.name}. You are conducting a pressure test of a venture concept. Your job is to ask the hardest, most uncomfortable questions this persona would ask — grounded in the specific details of this venture, not generic startup skepticism. Do not accept vague answers. Push back with data, counterexamples, and specific challenges. Stay fully in character. Ask one sharp question at a time and wait for the response before following up. Here is the full venture context:\n\n${ventureContext}`;
    try {
      const resp = await callClaude(systemPrompt, `Begin the pressure test of "${venture.name.value}". Ask your first, sharpest question.`);
      setMessages([{ role: "assistant", content: resp, persona: persona.name, source: "PRESSURE_TEST" }]);
    } catch (e) {
      setMessages([{ role: "assistant", content: "Let's examine this venture. Tell me — why should anyone invest in this?", persona: persona.name, source: "PRESSURE_TEST" }]);
    }
    setLoading(false);
  };

  const sendResponse = async () => {
    if (!input.trim() || loading || !activePersona) return;
    const userMsg = { role: "user", content: input, source: "FOUNDER" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = [...messages, userMsg].map((m) => `[${m.role === "assistant" ? activePersona.name : "Founder"}]: ${m.content}`).join("\n");
    const systemPrompt = `You are ${activePersona.name}. Continue the pressure test. Stay in character. Push back hard on weak answers. Acknowledge strong answers briefly. Ask your next question. The conversation so far:\n${history}\n\nVenture context:\n${ventureContext}`;

    try {
      const resp = await callClaude(systemPrompt, input);
      setMessages((prev) => [...prev, { role: "assistant", content: resp, persona: activePersona.name, source: "PRESSURE_TEST" }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Interesting. Let me push on a different angle — what happens when your biggest competitor copies this in 6 months?", persona: activePersona.name, source: "PRESSURE_TEST" }]);
    }
    setLoading(false);
  };

  if (!sessionStarted) {
    return (
      <div className="p-6 h-full overflow-auto scrollbar-thin">
        <h2 className="font-heading font-bold mb-2" style={{ fontSize: 22 }}>Shark Tank Pressure Test</h2>
        <p className="mb-6" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Select personas to challenge {venture.name.value}. Each persona asks the hardest questions from their domain.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {PERSONAS.map((p) => (
            <div
              key={p.id}
              className="glass-card glass-card-hover p-4 cursor-pointer"
              style={{ borderColor: selectedPersonas.includes(p.id) ? p.color : undefined }}
              onClick={() => startSession(p)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                <span className="font-heading font-semibold" style={{ fontSize: 14 }}>{p.name}</span>
              </div>
              <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.archetype}</p>
              <p className="mt-2" style={{ fontSize: 11, color: "var(--text-muted)" }}>Will pressure test: {p.focus}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", background: "rgba(19,17,28,0.5)" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: activePersona.color }} />
        <span className="font-heading font-semibold" style={{ fontSize: 14 }}>{activePersona.name}</span>
        <span className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{activePersona.archetype}</span>
        <button
          onClick={() => { setSessionStarted(false); setActivePersona(null); setMessages([]); }}
          className="ml-auto font-mono px-3 py-1 rounded"
          style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          ← Back to Personas
        </button>
      </div>

      <div ref={chatRef} className="flex-1 overflow-auto p-6 space-y-4 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"} animate-fadeIn`}>
            <div
              className="rounded-xl px-4 py-3"
              style={{
                maxWidth: "70%",
                background: msg.role === "assistant" ? `${activePersona.color}10` : "rgba(30,26,46,0.8)",
                border: `1px solid ${msg.role === "assistant" ? `${activePersona.color}30` : "var(--border)"}`,
              }}
            >
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{msg.content}</p>
              <SourceChip source={msg.source} subSource={msg.persona} small />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-3" style={{ background: `${activePersona.color}10`, border: `1px solid ${activePersona.color}30` }}>
              <LoadingDots message={`The ${activePersona.name.replace("The ", "")} is reviewing your venture...`} />
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border)", background: "rgba(19,17,28,0.5)" }}>
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Defend your venture..."
            className="flex-1"
            rows={2}
            style={{ fontSize: 13 }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendResponse(); } }}
          />
          <button
            onClick={sendResponse}
            disabled={loading || !input.trim()}
            className="px-4 rounded-lg font-heading font-semibold self-end"
            style={{ height: 40, fontSize: 13, background: loading || !input.trim() ? "var(--border)" : activePersona.color, color: "#fff", border: "none", opacity: loading || !input.trim() ? 0.5 : 1 }}
          >
            Respond
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pitch Deck Generator ────────────────────────────────────────────────────
function PitchDeckGenerator({ ventures, setVentures, activeVenture }) {
  const venture = ventures[activeVenture];
  const [audience, setAudience] = useState("Studio Investment Committee");
  const [purpose, setPurpose] = useState("Stage Gate Advancement");
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState(null);
  const [error, setError] = useState(null);

  if (!venture) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center" style={{ maxWidth: 400 }}>
          <h2 className="font-heading font-bold mb-2" style={{ fontSize: 20 }}>Pitch Deck Generator</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Select a venture from the Dashboard first.</p>
        </div>
      </div>
    );
  }

  const ventureContext = Object.entries(venture.interview?.sections || {})
    .map(([k, v]) => `${k}: ${v.value}`)
    .join("\n\n");

  const generateDeck = async () => {
    setLoading(true);
    setError(null);
    const systemPrompt = `You are a world-class venture storyteller generating a pitch deck for a corporate venture studio. Synthesize everything known about this venture into a compelling, honest narrative. Do not invent claims — work only with the venture data provided. Where data is thin, name the gap directly. Make every word earn its place. Avoid generic startup language. Return a JSON array of 12 slide objects, each containing: slide_number (integer), title (max 8 words string), body (string with 3-5 bullets or short paragraph), speaker_notes (string), and source_citations (array of source tag strings like "FOUNDER", "AI_SYNTHESIS"). Return ONLY valid JSON array, no markdown fences, no extra text.`;

    try {
      const resp = await callClaudeJSON(
        systemPrompt,
        `Generate a 12-slide pitch deck for "${venture.name.value}". Audience: ${audience}. Purpose: ${purpose}.\n\nVenture Data:\n${ventureContext}`
      );
      const slides = Array.isArray(resp) ? resp : resp.slides || [];
      const deckData = {
        audience,
        purpose,
        slides,
        completeness: `${slides.length}/12`,
      };
      setDeck(deckData);
      // Save to venture
      setVentures((prev) => ({
        ...prev,
        [activeVenture]: {
          ...prev[activeVenture],
          pitchDeck: makeField(deckData, "PITCH"),
        },
      }));
    } catch (e) {
      setError("Failed to generate pitch deck. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 h-full overflow-auto scrollbar-thin">
      <h2 className="font-heading font-bold mb-2" style={{ fontSize: 22 }}>Pitch Deck Generator</h2>
      <p className="mb-6" style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Generate a 12-slide pitch deck for {venture.name.value}
      </p>

      {!deck && !loading && (
        <div className="glass-card p-6" style={{ maxWidth: 500 }}>
          <div className="mb-4">
            <label className="font-mono block mb-1" style={{ fontSize: 11, color: "var(--text-muted)" }}>Audience</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full" style={{ fontSize: 13 }}>
              <option>Studio Investment Committee</option>
              <option>Design Partner / Potential Client</option>
              <option>External VC / Co-investor</option>
              <option>Executive Sponsor</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="font-mono block mb-1" style={{ fontSize: 11, color: "var(--text-muted)" }}>Purpose</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full" style={{ fontSize: 13 }}>
              <option>Stage Gate Advancement</option>
              <option>Initial Concept Pitch</option>
              <option>Design Partner Recruitment</option>
              <option>Investment Ask</option>
            </select>
          </div>
          <button
            onClick={generateDeck}
            className="w-full py-2.5 rounded-lg font-heading font-semibold"
            style={{ fontSize: 14, background: "var(--accent-primary)", color: "#fff", border: "none" }}
          >
            Generate Deck
          </button>
          {error && <p className="mt-2 font-mono" style={{ fontSize: 11, color: "#EF4444" }}>{error}</p>}
        </div>
      )}

      {loading && (
        <div className="glass-card p-8 flex items-center justify-center" style={{ minHeight: 200 }}>
          <LoadingDots message="Crafting your narrative..." />
        </div>
      )}

      {deck && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <SourceChip source="PITCH" />
            <span className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{deck.audience} · {deck.purpose} · {deck.completeness}</span>
            <button
              onClick={() => setDeck(null)}
              className="ml-auto font-mono px-3 py-1 rounded"
              style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              Regenerate
            </button>
          </div>
          {deck.slides?.map((slide) => (
            <div key={slide.slide_number} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono" style={{ fontSize: 11, color: "var(--accent-primary)", fontWeight: 600 }}>
                  {String(slide.slide_number).padStart(2, "0")}
                </span>
                <span className="font-heading font-semibold" style={{ fontSize: 15 }}>{slide.title}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{slide.body}</p>
              {slide.speaker_notes && (
                <div className="mt-2 p-2 rounded" style={{ background: "rgba(124,106,247,0.06)" }}>
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>Notes: </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{slide.speaker_notes}</span>
                </div>
              )}
              {slide.source_citations?.length > 0 && (
                <div className="flex gap-1 mt-2">{slide.source_citations.map((s, i) => <SourceChip key={i} source={s} small />)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Business Case Generator ─────────────────────────────────────────────────
function BusinessCaseGenerator({ ventures, setVentures, activeVenture }) {
  const venture = ventures[activeVenture];
  const [loading, setLoading] = useState(false);
  const [bizCase, setBizCase] = useState(null);
  const [committeeContext, setCommitteeContext] = useState("");
  const [error, setError] = useState(null);

  if (!venture) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center" style={{ maxWidth: 400 }}>
          <h2 className="font-heading font-bold mb-2" style={{ fontSize: 20 }}>Investment Business Case</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Select a venture from the Dashboard first.</p>
        </div>
      </div>
    );
  }

  // Show existing business case if present
  if (venture.businessCase?.value && !bizCase && !loading) {
    return <VentureBusinessCase venture={venture} />;
  }

  const ventureContext = Object.entries(venture.interview?.sections || {})
    .map(([k, v]) => `${k}: ${v.value}`)
    .join("\n\n");

  const generateCase = async () => {
    setLoading(true);
    setError(null);
    const systemPrompt = `You are a senior venture analyst preparing a formal investment business case for a Studio Investment Committee. Synthesize all available venture data into a rigorous, honest, decision-ready document. Do not inflate claims or paper over gaps — name them directly and specify the validation needed. Every claim must trace back to a source tag. No filler, no hedge words, no consultant speak. Return a JSON object with keys for each section, each containing: title (string), content (string of structured prose), source_citations (array of source tag strings), and gap_alerts (array of strings identifying thin evidence areas). Sections: executive_summary, problem_market, solution_differentiation, icp, revenue_model, competitive_landscape, validation_evidence, risk_register, team_resources, investment_recommendation. The investment_recommendation must include a verdict field: "Approve", "Approve with Conditions", "Defer", or "Kill". Return ONLY valid JSON, no markdown fences.`;

    try {
      const resp = await callClaudeJSON(
        systemPrompt,
        `Generate a full investment business case for "${venture.name.value}".\n\nCommittee Context: ${committeeContext || "None provided"}\n\nVenture Data:\n${ventureContext}`
      );
      setBizCase(resp);
      setVentures((prev) => ({
        ...prev,
        [activeVenture]: {
          ...prev[activeVenture],
          businessCase: makeField({ status: "generated", sections: resp, verdict: resp.investment_recommendation?.verdict || "Pending", conditions: [] }, "BIZ_CASE"),
        },
      }));
    } catch (e) {
      setError("Failed to generate business case. Please try again.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="glass-card p-8" style={{ minWidth: 300 }}>
          <LoadingDots message="Building your Investment Business Case..." />
        </div>
      </div>
    );
  }

  if (bizCase) {
    return (
      <div className="p-6 h-full overflow-auto scrollbar-thin animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-heading font-bold" style={{ fontSize: 22 }}>Investment Business Case</h2>
          <SourceChip source="BIZ_CASE" />
        </div>
        {Object.entries(bizCase).map(([key, section]) => (
          <div key={key} className="glass-card p-4 mb-3">
            <h4 className="font-heading font-semibold mb-2" style={{ fontSize: 14 }}>{section.title || key.replace(/_/g, " ")}</h4>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{section.content}</p>
            {section.gap_alerts?.length > 0 && section.gap_alerts.map((gap, i) => (
              <div key={i} className="mt-2 p-2 rounded" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <span className="font-mono" style={{ fontSize: 11, color: "#F59E0B" }}>⚠ {gap}</span>
              </div>
            ))}
            {section.source_citations?.length > 0 && (
              <div className="flex gap-1 mt-2">{section.source_citations.map((s, i) => <SourceChip key={i} source={s} small />)}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="glass-card p-6" style={{ maxWidth: 500 }}>
        <h2 className="font-heading font-bold mb-2" style={{ fontSize: 20 }}>Generate Investment Business Case</h2>
        <p className="mb-4" style={{ fontSize: 13, color: "var(--text-muted)" }}>
          For {venture.name.value} — {venture.description?.value?.slice(0, 100)}...
        </p>
        <div className="mb-4">
          <label className="font-mono block mb-1" style={{ fontSize: 11, color: "var(--text-muted)" }}>Committee Context (optional)</label>
          <textarea
            value={committeeContext}
            onChange={(e) => setCommitteeContext(e.target.value)}
            placeholder="Known objections, emphasis areas..."
            className="w-full"
            rows={3}
            style={{ fontSize: 13 }}
          />
        </div>
        <button
          onClick={generateCase}
          className="w-full py-2.5 rounded-lg font-heading font-semibold"
          style={{ fontSize: 14, background: "var(--accent-primary)", color: "#fff", border: "none" }}
        >
          Generate Business Case
        </button>
        {error && <p className="mt-2 font-mono" style={{ fontSize: 11, color: "#EF4444" }}>{error}</p>}
      </div>
    </div>
  );
}

// ─── Design Partner Scorecard ────────────────────────────────────────────────
function DesignPartnerView({ ventures, setVentures, activeVenture }) {
  const venture = ventures[activeVenture];
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [loading, setLoading] = useState(false);

  if (!venture) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center" style={{ maxWidth: 400 }}>
          <h2 className="font-heading font-bold mb-2" style={{ fontSize: 20 }}>Design Partners</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Select a venture from the Dashboard first.</p>
        </div>
      </div>
    );
  }

  const dp = venture.designPartners || [];
  const signed = dp.filter((d) => d.stage.value === "Signed").length;

  const addCandidate = async () => {
    if (!newCompany.trim()) return;
    setLoading(true);
    const ventureContext = Object.entries(venture.interview?.sections || {})
      .map(([k, v]) => `${k}: ${v.value}`)
      .join("\n\n");

    let score = null;
    try {
      const resp = await callClaudeJSON(
        `You are evaluating a potential design partner for a venture. Score this candidate on 8 dimensions (1-5 each): ICP Match, Pain Acuteness, Willingness to Pay, Decision Authority, Data & Access, Referencability, Strategic Fit, Engagement Enthusiasm. Return ONLY a JSON object with: scores (object of dimension:number), total (number sum of all scores), verdict (string: "Strong Candidate", "Conditional", "Low Priority", or "Disqualify"), recommendation (string, 2-3 sentences on next action). No markdown.`,
        `Venture: ${venture.name.value}\n${ventureContext}\n\nCandidate: ${newCompany}, Contact: ${newContact}, Industry: ${newIndustry}`
      );
      score = resp;
    } catch (e) {
      score = { total: 0, verdict: "Pending", recommendation: "Assessment pending." };
    }

    const newDP = {
      id: `dp_${Date.now()}`,
      company: makeField(newCompany, "VL"),
      contact: makeField(newContact, "VL"),
      industry: makeField(newIndustry, "VL"),
      size: makeField("", "VL"),
      interest: makeField("Warm", "VL"),
      stage: makeField("Identified", "VL"),
      score: makeField(score, "SCORING", "Design Partner"),
      notes: [],
    };

    setVentures((prev) => ({
      ...prev,
      [activeVenture]: {
        ...prev[activeVenture],
        designPartners: [...(prev[activeVenture].designPartners || []), newDP],
      },
    }));
    setShowAddForm(false);
    setNewCompany("");
    setNewContact("");
    setNewIndustry("");
    setLoading(false);
  };

  return (
    <div className="p-6 h-full overflow-auto scrollbar-thin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold" style={{ fontSize: 22 }}>Design Partners — {venture.name.value}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono" style={{ fontSize: 12, color: signed >= 3 ? "#10B981" : "#F59E0B" }}>
              {signed}/3 Signed
            </span>
            {/* Funnel mini */}
            {["Identified", "Contacted", "Conversation", "LOI", "Signed"].map((s) => {
              const count = dp.filter((d) => d.stage.value === s).length;
              return count > 0 ? (
                <span key={s} className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {s}: {count}
                </span>
              ) : null;
            })}
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-lg font-heading font-semibold"
          style={{ fontSize: 13, background: "var(--accent-primary)", color: "#fff", border: "none" }}
        >
          + Add Candidate
        </button>
      </div>

      {showAddForm && (
        <div className="glass-card p-4 mb-4 animate-fadeIn">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company name" style={{ fontSize: 13 }} />
            <input value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="Contact name & title" style={{ fontSize: 13 }} />
            <input value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} placeholder="Industry" style={{ fontSize: 13 }} />
          </div>
          <button
            onClick={addCandidate}
            disabled={loading || !newCompany.trim()}
            className="px-4 py-2 rounded-lg font-heading font-semibold"
            style={{ fontSize: 13, background: loading ? "var(--border)" : "var(--accent-secondary)", color: "#fff", border: "none" }}
          >
            {loading ? "Assessing candidate fit..." : "Add & Assess"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {dp.sort((a, b) => (b.score?.value?.total || 0) - (a.score?.value?.total || 0)).map((d) => (
          <div key={d.id} className="glass-card p-4 animate-slideIn">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-heading font-semibold" style={{ fontSize: 14 }}>{d.company.value}</span>
                <SourceChip source="DESIGN_PARTNER" subSource={d.company.value.split(" ")[0]} small />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono px-2 py-1 rounded"
                  style={{
                    fontSize: 10,
                    background: d.stage.value === "Signed" ? "#10B98118" : d.stage.value === "Conversation" ? "#4F9CF918" : "#8B87A818",
                    color: d.stage.value === "Signed" ? "#10B981" : d.stage.value === "Conversation" ? "#4F9CF9" : "#8B87A8",
                    border: `1px solid ${d.stage.value === "Signed" ? "#10B98140" : "var(--border)"}`,
                  }}
                >
                  {d.stage.value}
                </span>
                <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-primary)" }}>
                  {d.score?.value?.total || "—"}/40
                </span>
              </div>
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {d.contact.value} · {d.industry.value}
            </div>
            {d.score?.value?.verdict && (
              <span className="font-mono" style={{
                fontSize: 10,
                color: d.score.value.verdict === "Strong Candidate" ? "#10B981" : d.score.value.verdict === "Conditional" ? "#F59E0B" : "#8B87A8",
              }}>
                {d.score.value.verdict}
              </span>
            )}
            {d.score?.value?.recommendation && (
              <p className="mt-2" style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>{d.score.value.recommendation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Portfolio Report ────────────────────────────────────────────────────────
function PortfolioReport({ ventures }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    const ventureList = Object.values(ventures);

    const portfolioData = ventureList.map((v) => ({
      name: v.name.value,
      stage: v.stage.value,
      founder: v.founder.value,
      status: v.status.value,
      description: v.description.value,
      compositeSignal: v.compositeSignal?.value || "Pending",
      designPartners: v.designPartners?.length || 0,
      designPartnersSigned: v.designPartners?.filter((d) => d.stage.value === "Signed").length || 0,
      pitchDeck: v.pitchDeck ? "Generated" : "None",
      businessCase: v.businessCase?.value?.verdict || "None",
      weeklyNotes: v.weeklyNotes?.value || "",
    }));

    const systemPrompt = `You are a senior venture studio operator preparing the weekly portfolio report for the Studio Investment Committee. Give a precise, honest, actionable snapshot of every active venture. Do not write fluff. Each venture summary must identify: current status, what happened this week, what's at risk, and what decision or action is needed from the committee. Write in tight, declarative sentences. Flag problems directly — do not soften. Return a JSON object with these keys: portfolio_snapshot (object with total, stage_distribution, at_risk_count), venture_summaries (array of objects with name, stage, status, description, this_week, blockers, signal, recommended_action), actions_required (array of strings), health_signal (string: Accelerating/Steady/Decelerating with explanation), key_risks (array of strings), milestones (array of strings). Return ONLY valid JSON, no markdown fences.`;

    try {
      const resp = await callClaudeJSON(
        systemPrompt,
        `Generate the weekly portfolio report. Today is ${new Date().toLocaleDateString()}.\n\nPortfolio Data:\n${JSON.stringify(portfolioData, null, 2)}`
      );
      setReport(resp);
    } catch (e) {
      setError("Failed to generate portfolio report. Please try again.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="glass-card p-8"><LoadingDots message="Compiling portfolio snapshot..." /></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center" style={{ maxWidth: 480 }}>
          <h2 className="font-heading font-bold mb-2" style={{ fontSize: 22 }}>Weekly Portfolio Report</h2>
          <p className="mb-4" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Generate a comprehensive weekly report covering all {Object.keys(ventures).length} active ventures.
          </p>
          <button
            onClick={generateReport}
            className="w-full py-2.5 rounded-lg font-heading font-semibold"
            style={{ fontSize: 14, background: "var(--accent-primary)", color: "#fff", border: "none" }}
          >
            Generate Report
          </button>
          {error && <p className="mt-2 font-mono" style={{ fontSize: 11, color: "#EF4444" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto scrollbar-thin animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-heading font-bold" style={{ fontSize: 22 }}>Weekly Portfolio Report</h2>
        <SourceChip source="PORTFOLIO_RPT" subSource={new Date().toLocaleDateString()} />
        <button
          onClick={() => setReport(null)}
          className="ml-auto font-mono px-3 py-1 rounded"
          style={{ fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          Regenerate
        </button>
      </div>

      {/* Snapshot */}
      {report.portfolio_snapshot && (
        <div className="glass-card p-4 mb-4">
          <h3 className="font-heading font-semibold mb-2" style={{ fontSize: 15 }}>Portfolio Snapshot</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="font-mono block" style={{ fontSize: 10, color: "var(--text-muted)" }}>Total Ventures</span>
              <span className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-primary)" }}>
                {report.portfolio_snapshot.total || Object.keys(ventures).length}
              </span>
            </div>
            <div>
              <span className="font-mono block" style={{ fontSize: 10, color: "var(--text-muted)" }}>At Risk</span>
              <span className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: "#F59E0B" }}>
                {report.portfolio_snapshot.at_risk_count || 0}
              </span>
            </div>
            <div>
              <span className="font-mono block" style={{ fontSize: 10, color: "var(--text-muted)" }}>Health Signal</span>
              <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-success)" }}>
                {report.health_signal || "Steady"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Venture summaries */}
      {report.venture_summaries?.map((vs, i) => (
        <div key={i} className="glass-card p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-heading font-semibold" style={{ fontSize: 14 }}>{vs.name}</span>
            <StageBadge stageId={vs.stage} small />
            <StatusChip status={vs.status} />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{vs.description}</p>
          {vs.this_week && (
            <div className="mt-2">
              <span className="font-mono" style={{ fontSize: 10, color: "var(--accent-secondary)" }}>This Week: </span>
              <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{vs.this_week}</span>
            </div>
          )}
          {vs.blockers && (
            <div className="mt-1">
              <span className="font-mono" style={{ fontSize: 10, color: "#EF4444" }}>Blockers: </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{vs.blockers}</span>
            </div>
          )}
          {vs.recommended_action && (
            <div className="mt-1">
              <span className="font-mono" style={{ fontSize: 10, color: "#10B981" }}>Action: </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{vs.recommended_action}</span>
            </div>
          )}
        </div>
      ))}

      {/* Actions Required */}
      {report.actions_required?.length > 0 && (
        <div className="glass-card p-4 mb-3">
          <h3 className="font-heading font-semibold mb-2" style={{ fontSize: 15, color: "#F59E0B" }}>Investment Committee Actions Required</h3>
          {report.actions_required.map((a, i) => (
            <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded" style={{ background: "rgba(245,158,11,0.06)" }}>
              <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key Risks */}
      {report.key_risks?.length > 0 && (
        <div className="glass-card p-4 mb-3">
          <h3 className="font-heading font-semibold mb-2" style={{ fontSize: 15, color: "#EF4444" }}>Key Risks This Week</h3>
          {report.key_risks.map((r, i) => (
            <p key={i} className="mb-1" style={{ fontSize: 12, color: "var(--text-muted)" }}>• {r}</p>
          ))}
        </div>
      )}

      {/* Milestones */}
      {report.milestones?.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-heading font-semibold mb-2" style={{ fontSize: 15 }}>Upcoming Milestones</h3>
          {report.milestones.map((m, i) => (
            <p key={i} className="mb-1" style={{ fontSize: 12, color: "var(--text-muted)" }}>• {m}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Scoring Mode ────────────────────────────────────────────────────────────
function ScoringMode({ ventures, setVentures, activeVenture }) {
  const venture = ventures[activeVenture];
  const [lens, setLens] = useState("corporate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!venture) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center" style={{ maxWidth: 400 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Select a venture from the Dashboard first.</p>
        </div>
      </div>
    );
  }

  if (venture.scoring?.[lens]?.value) {
    return (
      <div className="p-6 h-full overflow-auto scrollbar-thin">
        <VentureScoring venture={venture} />
      </div>
    );
  }

  return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="glass-card p-8 text-center" style={{ maxWidth: 400 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Scoring is available on the Venture Detail view.</p>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [ventures, setVentures] = useState(() => createSeedData());
  const [activeView, setActiveView] = useState("dashboard");
  const [activeVenture, setActiveVenture] = useState(null);

  const onGenerateReport = () => {
    setActiveView("portfolio");
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard ventures={ventures} setActiveVenture={setActiveVenture} setActiveView={setActiveView} />;
      case "ventureDetail":
        return <VentureDetail venture={ventures[activeVenture]} setVentures={setVentures} ventures={ventures} />;
      case "interview":
        return <FounderInterview ventures={ventures} setVentures={setVentures} activeVenture={activeVenture} setActiveVenture={setActiveVenture} />;
      case "pressure":
        return <PressureTest ventures={ventures} setVentures={setVentures} activeVenture={activeVenture} />;
      case "pitchdeck":
        return <PitchDeckGenerator ventures={ventures} setVentures={setVentures} activeVenture={activeVenture} />;
      case "bizcase":
        return <BusinessCaseGenerator ventures={ventures} setVentures={setVentures} activeVenture={activeVenture} />;
      case "designpartners":
        return <DesignPartnerView ventures={ventures} setVentures={setVentures} activeVenture={activeVenture} />;
      case "portfolio":
        return <PortfolioReport ventures={ventures} />;
      default:
        return <Dashboard ventures={ventures} setActiveVenture={setActiveVenture} setActiveView={setActiveView} />;
    }
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div className="flex flex-col" style={{ height: "100vh", background: "var(--bg)" }}>
        {/* Gradient background */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(ellipse at 20% 20%, rgba(124,106,247,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(79,156,249,0.04) 0%, transparent 50%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
          <TopNav
            activeView={activeView}
            setActiveView={setActiveView}
            activeVenture={activeVenture}
            ventures={ventures}
            onGenerateReport={onGenerateReport}
          />
          <main className="flex-1 overflow-hidden">
            {renderView()}
          </main>
        </div>
      </div>
    </>
  );
}
