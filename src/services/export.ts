import { Document, Paragraph, HeadingLevel, Packer, ExternalHyperlink, TextRun } from 'docx'
import PptxGenJS from 'pptxgenjs'
import type {
  VentureCitation,
  TechnicalArchitecture,
  ProductRoadmap,
  FeaturePrd,
  SprintPlan,
  ClientFeedbackSummary,
  UpdatedRoadmap,
  PricingLabRecommendation,
} from '@/types/venture'

function buildSourcesParagraphs(citations: VentureCitation[]): Paragraph[] {
  if (!citations.length) return []
  return [
    new Paragraph({
      text: 'Sources',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 600, after: 200 },
    }),
    ...citations.map((c, i) => {
      const children: (TextRun | ExternalHyperlink)[] = [
        new TextRun({ text: `[${i + 1}] ${c.title}`, bold: true }),
      ]
      if (c.url) {
        children.push(new TextRun({ text: ' — ' }))
        children.push(
          new ExternalHyperlink({
            children: [new TextRun({ text: c.url, style: 'Hyperlink' })],
            link: c.url,
          })
        )
      }
      children.push(new TextRun({ text: ` (via ${c.context})`, italics: true }))
      return new Paragraph({ children, spacing: { after: 120 } })
    }),
  ]
}

export interface BusinessBriefSections {
  opportunityOverview: string
  problemAndPainPoints: string
  idealCustomerProfile: string
  solutionOverview: string
  marketAnalysis: string
  recommendations: string
}

export async function createBusinessBriefDocx(
  ventureName: string,
  sections: BusinessBriefSections,
  citations: VentureCitation[] = []
): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: ventureName,
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Business Brief',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 300 },
          }),
          new Paragraph({
            text: 'Opportunity Overview + Why Now',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: sections.opportunityOverview,
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: 'Problem & Pain Points',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: sections.problemAndPainPoints,
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: 'Ideal Customer Profile',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: sections.idealCustomerProfile,
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: 'Solution Overview',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: sections.solutionOverview,
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: 'Market Analysis',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: sections.marketAnalysis,
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: 'Recommendations',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: sections.recommendations,
            spacing: { after: 400 },
          }),
          ...buildSourcesParagraphs(citations),
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}

export interface InvestmentMemoSections {
  executiveSummary: string
  opportunityOverview: string
  problemAndMarket: string
  solutionAndDifferentiation: string
  idealCustomerProfile: string
  revenueModel: string
  competitiveLandscape: string
  validationEvidence: string
  riskRegister: string
  stage04PlanAndRecommendation: string
}

export async function createInvestmentMemoDocx(
  ventureName: string,
  sections: InvestmentMemoSections,
  citations: VentureCitation[] = []
): Promise<Blob> {
  const sectionTitles: [keyof InvestmentMemoSections, string][] = [
    ['executiveSummary', 'Executive Summary'],
    ['opportunityOverview', 'Opportunity Overview + Why Now'],
    ['problemAndMarket', 'Problem & Market Opportunity'],
    ['solutionAndDifferentiation', 'Solution & Differentiation'],
    ['idealCustomerProfile', 'Ideal Customer Profile'],
    ['revenueModel', 'Revenue Model & Unit Economics'],
    ['competitiveLandscape', 'Competitive Landscape'],
    ['validationEvidence', 'Validation Evidence'],
    ['riskRegister', 'Risk Register'],
    ['stage04PlanAndRecommendation', 'Stage 04 Plan & Investment Recommendation'],
  ]
  const children = sectionTitles.flatMap(([key, title], i) => {
    const text = sections[key]
    return [
      new Paragraph({
        text: title,
        heading: i === 0 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: i === 0 ? 200 : 300, after: 200 },
      }),
      new Paragraph({ text, spacing: { after: 300 } }),
    ]
  })
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: ventureName,
            heading: HeadingLevel.TITLE,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: 'Investment Memo',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 400 },
          }),
          ...children,
          ...buildSourcesParagraphs(citations),
        ],
      },
    ],
  })
  return Packer.toBlob(doc)
}

export interface PitchDeckSlides {
  theHook: string
  theProblem: string
  whyNow: string
  theSolution: string
  productVision: string
  idealCustomerProfile: string
  businessModel: string
  marketOpportunity: string
  competitiveLandscape: string
  tractionAndValidation: string
  theTeam: string
  theAsk: string
}

export async function createPitchDeckPptx(
  ventureName: string,
  slides: PitchDeckSlides,
  citations: VentureCitation[] = []
): Promise<Blob> {
  const pptx = new PptxGenJS()
  pptx.title = ventureName
  pptx.author = 'Venture OS'
  const slideConfig: [keyof PitchDeckSlides, string][] = [
    ['theHook', 'The Hook'],
    ['theProblem', 'The Problem'],
    ['whyNow', 'Why Now'],
    ['theSolution', 'The Solution'],
    ['productVision', 'Product Vision'],
    ['idealCustomerProfile', 'Ideal Customer Profile'],
    ['businessModel', 'Business Model'],
    ['marketOpportunity', 'Market Opportunity'],
    ['competitiveLandscape', 'Competitive Landscape'],
    ['tractionAndValidation', 'Traction & Validation'],
    ['theTeam', 'The Team'],
    ['theAsk', 'The Ask'],
  ]
  for (const [key, title] of slideConfig) {
    const slide = pptx.addSlide()
    slide.addText(title, { x: 0.5, y: 0.3, w: 9, fontSize: 24, bold: true })
    slide.addText(slides[key], { x: 0.5, y: 0.8, w: 9, h: 4.5, fontSize: 12 })
  }
  if (citations.length > 0) {
    const sourcesText = citations
      .map((c, i) => `[${i + 1}] ${c.title}${c.url ? ' — ' + c.url : ''} (via ${c.context})`)
      .join('\n')
    const sourcesSlide = pptx.addSlide()
    sourcesSlide.addText('Sources', { x: 0.5, y: 0.3, w: 9, fontSize: 24, bold: true })
    sourcesSlide.addText(sourcesText, { x: 0.5, y: 0.8, w: 9, h: 4.5, fontSize: 10 })
  }
  return pptx.write({ outputType: 'blob' }) as Promise<Blob>
}

export async function createOpportunityBriefDocx(
  ventureName: string,
  content: string
): Promise<Blob> {
  const paragraphs = content
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((text) => new Paragraph({ text: text.trim(), spacing: { after: 300 } }))

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: ventureName,
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Opportunity Brief',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 300 },
          }),
          ...paragraphs,
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}

// ── Stage 05: MVP Readiness ───────────────────────────────────

export async function createTechnicalArchitectureDocx(
  ventureName: string,
  arch: TechnicalArchitecture
): Promise<Blob> {
  const c = arch.content
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: ventureName,
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Technical Architecture',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 300 },
          }),
          new Paragraph({
            text: `Generated ${new Date(arch.generatedAt).toLocaleDateString()} · Source: ${arch.source}`,
            spacing: { after: 400 },
          }),
          new Paragraph({ text: 'Tech Stack', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          new Paragraph({ text: c.techStack, spacing: { after: 300 } }),
          new Paragraph({ text: 'Component Diagram', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          new Paragraph({ text: c.componentDiagram, spacing: { after: 300 } }),
          ...(c.mermaidDiagram
            ? [
                new Paragraph({ text: 'Architecture Diagram (Mermaid)', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
                new Paragraph({ text: 'Use the following Mermaid code in wikis or markdown viewers:', spacing: { after: 80 } }),
                new Paragraph({ text: c.mermaidDiagram, spacing: { after: 300 } }),
              ]
            : []),
          new Paragraph({ text: 'Integration Points', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          new Paragraph({ text: c.integrationPoints, spacing: { after: 300 } }),
          new Paragraph({ text: 'Key Decisions', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          new Paragraph({ text: c.keyDecisions, spacing: { after: 300 } }),
          new Paragraph({ text: 'Risks & Open Questions', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          new Paragraph({ text: c.risksAndOpenQuestions, spacing: { after: 200 } }),
        ],
      },
    ],
  })
  return Packer.toBlob(doc)
}

export async function createTechnicalArchitectureMarkdown(
  ventureName: string,
  arch: TechnicalArchitecture
): Promise<Blob> {
  const c = arch.content
  const lines: string[] = [
    `# ${ventureName}`,
    '',
    '## Technical Architecture',
    '',
    `*Generated ${new Date(arch.generatedAt).toLocaleDateString()} · Source: ${arch.source}*`,
    '',
    '### Tech Stack',
    '',
    c.techStack,
    '',
    '### Component Diagram',
    '',
    c.componentDiagram,
    '',
  ]
  if (c.mermaidDiagram) {
    lines.push('### Architecture Diagram', '', '```mermaid', c.mermaidDiagram, '```', '')
  }
  lines.push(
    '### Integration Points',
    '',
    c.integrationPoints,
    '',
    '### Key Decisions',
    '',
    c.keyDecisions,
    '',
    '### Risks & Open Questions',
    '',
    c.risksAndOpenQuestions,
  )
  const md = lines.join('\n')
  return new Blob([md], { type: 'text/markdown;charset=utf-8' })
}

export async function createProductRoadmapDocx(
  ventureName: string,
  roadmap: ProductRoadmap
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({ text: ventureName, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
    new Paragraph({ text: 'Product Roadmap', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 300 } }),
    new Paragraph({
      text: `Generated ${new Date(roadmap.generatedAt).toLocaleDateString()} · Source: ${roadmap.source}`,
      spacing: { after: 400 },
    }),
  ]
  for (const p of roadmap.phases) {
    children.push(
      new Paragraph({ text: p.phase, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
      new Paragraph({ text: `Milestones: ${p.milestones.join('; ')}`, spacing: { after: 120 } }),
      new Paragraph({ text: `Features in scope: ${p.featuresInScope.join(', ')}`, spacing: { after: 120 } }),
      new Paragraph({ text: `Success criteria: ${p.successCriteria.join('; ')}`, spacing: { after: 120 } }),
      ...(p.capitalRequirement ? [new Paragraph({ text: `Capital: ${p.capitalRequirement}`, spacing: { after: 200 } })] : [])
    )
  }
  const doc = new Document({
    sections: [{ properties: {}, children }],
  })
  return Packer.toBlob(doc)
}

export async function createFeaturePrdDocx(ventureName: string, prd: FeaturePrd): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: ventureName, heading: HeadingLevel.TITLE, spacing: { after: 200 } }),
          new Paragraph({ text: `Feature PRD: ${prd.name}`, heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 300 } }),
          new Paragraph({ text: `Generated ${new Date(prd.generatedAt).toLocaleDateString()} · Source: ${prd.source}`, spacing: { after: 300 } }),
          new Paragraph({ text: 'User Story', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          new Paragraph({ text: prd.userStory, spacing: { after: 300 } }),
          new Paragraph({ text: 'Acceptance Criteria', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          ...prd.acceptanceCriteria.map((ac) => new Paragraph({ text: `• ${ac}`, spacing: { after: 120 } })),
          new Paragraph({ text: 'In Scope', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          ...prd.inScope.map((s) => new Paragraph({ text: `• ${s}`, spacing: { after: 120 } })),
          new Paragraph({ text: 'Out of Scope', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          ...prd.outOfScope.map((s) => new Paragraph({ text: `• ${s}`, spacing: { after: 120 } })),
          new Paragraph({ text: 'Dependencies', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          ...prd.dependencies.map((d) => new Paragraph({ text: `• ${d}`, spacing: { after: 120 } })),
          ...(prd.designPartnerOrigin
            ? [
                new Paragraph({ text: 'Design Partner Origin', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
                new Paragraph({ text: prd.designPartnerOrigin, spacing: { after: 200 } }),
              ]
            : []),
        ],
      },
    ],
  })
  return Packer.toBlob(doc)
}

export async function createFeaturePrdListDocx(ventureName: string, prds: FeaturePrd[]): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({ text: ventureName, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
    new Paragraph({ text: 'Feature PRDs', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 400 } }),
  ]
  for (const prd of prds) {
    children.push(
      new Paragraph({ text: prd.name, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
      new Paragraph({ text: `Source: ${prd.source} · ${new Date(prd.generatedAt).toLocaleDateString()}`, spacing: { after: 150 } }),
      new Paragraph({ text: prd.userStory, spacing: { after: 200 } }),
      new Paragraph({ text: 'Acceptance criteria', heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 100 } }),
      ...prd.acceptanceCriteria.map((ac) => new Paragraph({ text: `• ${ac}`, spacing: { after: 80 } })),
      new Paragraph({ text: 'In scope', heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 100 } }),
      ...prd.inScope.map((s) => new Paragraph({ text: `• ${s}`, spacing: { after: 80 } })),
      new Paragraph({ text: 'Out of scope', heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 100 } }),
      ...prd.outOfScope.map((s) => new Paragraph({ text: `• ${s}`, spacing: { after: 80 } })),
      new Paragraph({ text: 'Dependencies', heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 100 } }),
      ...prd.dependencies.map((d) => new Paragraph({ text: `• ${d}`, spacing: { after: 80 } })),
      ...(prd.designPartnerOrigin
        ? [new Paragraph({ text: `Design partner origin: ${prd.designPartnerOrigin}`, spacing: { after: 200 } })]
        : [])
    )
  }
  const doc = new Document({
    sections: [{ properties: {}, children }],
  })
  return Packer.toBlob(doc)
}

export async function createSprintPlanDocx(ventureName: string, plan: SprintPlan): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({ text: ventureName, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
    new Paragraph({ text: 'Sprint Plan', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 300 } }),
    new Paragraph({
      text: `Generated ${new Date(plan.generatedAt).toLocaleDateString()} · Source: ${plan.source}`,
      spacing: { after: 400 },
    }),
    new Paragraph({ text: 'Assumptions', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
    ...plan.assumptions.flatMap((a) => [
      new Paragraph({ text: `• ${a.label}: ${a.value} (${a.source})`, spacing: { after: 120 } }),
    ]),
  ]
  for (const s of plan.sprints) {
    children.push(
      new Paragraph({
        text: `Sprint ${s.sprintNumber} (${s.durationWeeks} weeks)`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }),
      new Paragraph({ text: `Features: ${s.featuresInScope.join(', ')}`, spacing: { after: 120 } }),
      new Paragraph({ text: `Definition of Done: ${s.definitionOfDone}`, spacing: { after: 120 } }),
      new Paragraph({ text: `Acceptance criteria: ${s.acceptanceCriteria.join('; ')}`, spacing: { after: 200 } })
    )
  }
  const doc = new Document({
    sections: [{ properties: {}, children }],
  })
  return Packer.toBlob(doc)
}

// ── Stage 06: Build & Pilot ───────────────────────────────────

export async function createClientFeedbackSummaryDocx(
  ventureName: string,
  summary: ClientFeedbackSummary
): Promise<Blob> {
  const c = summary.content
  const section = (title: string, items: string[]) => [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
    ...items.map((item) => new Paragraph({ text: `• ${item}`, spacing: { after: 120 } })),
  ]
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: ventureName, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
          new Paragraph({ text: 'Client Feedback Summary', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 300 } }),
          new Paragraph({
            text: `Generated ${new Date(summary.generatedAt).toLocaleDateString()} · Source: ${summary.source} · Clients: ${summary.clientTags.map((t) => t.companyName).join(', ')}`,
            spacing: { after: 400 },
          }),
          ...section('Themes', c.themes),
          ...section('Divergence', c.divergence),
          ...section('Top Signals', c.topSignals),
          ...section('Product Gaps', c.productGaps),
          new Paragraph({ text: 'Narrative', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
          ...c.narrative.split(/\n{2,}/).filter(Boolean).map((p) => new Paragraph({ text: p.trim(), spacing: { after: 200 } })),
        ],
      },
    ],
  })
  return Packer.toBlob(doc)
}

export async function createUpdatedRoadmapDocx(
  ventureName: string,
  roadmap: UpdatedRoadmap
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({ text: ventureName, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
    new Paragraph({ text: 'Updated Roadmap', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 300 } }),
    new Paragraph({
      text: `Generated ${new Date(roadmap.generatedAt).toLocaleDateString()} · Source: ${roadmap.source}`,
      spacing: { after: 400 },
    }),
  ]
  for (const p of roadmap.phases) {
    children.push(
      new Paragraph({ text: p.phase, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }),
      new Paragraph({ text: `Milestones: ${p.milestones.join('; ')}`, spacing: { after: 120 } }),
      new Paragraph({ text: `Features: ${p.featuresInScope.join(', ')}`, spacing: { after: 120 } }),
      new Paragraph({ text: `Success criteria: ${p.successCriteria.join('; ')}`, spacing: { after: 200 } })
    )
  }
  const doc = new Document({
    sections: [{ properties: {}, children }],
  })
  return Packer.toBlob(doc)
}

export async function createPricingLabRecommendationDocx(
  ventureName: string,
  recommendation: PricingLabRecommendation
): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: ventureName, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
          new Paragraph({ text: 'Pricing Lab Recommendation', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 300 } }),
          new Paragraph({
            text: `Generated ${new Date(recommendation.generatedAt).toLocaleDateString()} · Source: ${recommendation.source}`,
            spacing: { after: 400 },
          }),
          new Paragraph({ text: 'Tier Structure', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          new Paragraph({ text: recommendation.tierStructure, spacing: { after: 300 } }),
          new Paragraph({ text: 'Price Points', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          new Paragraph({ text: recommendation.pricePoints, spacing: { after: 300 } }),
          new Paragraph({ text: 'Discounting Policy', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          new Paragraph({ text: recommendation.discountingPolicy, spacing: { after: 300 } }),
          new Paragraph({ text: 'Rationale', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 150 } }),
          ...recommendation.rationale.split(/\n{2,}/).filter(Boolean).map((p) => new Paragraph({ text: p.trim(), spacing: { after: 200 } })),
        ],
      },
    ],
  })
  return Packer.toBlob(doc)
}
