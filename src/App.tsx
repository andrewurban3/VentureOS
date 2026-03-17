import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { VentureProvider } from '@/context/VentureContext'
import { DiscoverProvider } from '@/context/DiscoverContext'
import { RoleProvider, useRole } from '@/context/RoleContext'
import { RolePicker } from '@/components/RolePicker'
import { RequireVenture } from '@/components/RequireVenture'
import { RequireVentureLead } from '@/components/RequireVentureLead'
import { VentureContextBar } from '@/components/VentureContextBar'
import StageNav from '@/components/StageNav'
import FounderNav from '@/components/FounderNav'
import DiscoverNav from '@/components/DiscoverNav'
import { RoleLanding } from '@/features/landing/RoleLanding'
import { FounderLanding } from '@/features/founder/FounderLanding'
import { VentureLeadDashboard } from '@/features/venture-lead/VentureLeadDashboard'
import { IdeaIntake } from '@/features/idea-intake/IdeaIntake'
import { Scoring } from '@/features/scoring/Scoring'
import { PressureTest } from '@/features/pressure-test/PressureTest'
import { Outputs } from '@/features/outputs/Outputs'
import { IncubateOutputs } from '@/features/outputs/IncubateOutputs'
import { IcpBuilder } from '@/features/define/IcpBuilder'
import { Competitors } from '@/features/define/Competitors'
import { ClientList } from '@/features/incubate/ClientList'
import { FinancialModels } from '@/features/incubate/FinancialModels'
import { InterviewInsights } from '@/features/incubate/InterviewInsights'
import { StrategyMoat } from '@/features/incubate/StrategyMoat'
import { SolutionDefinition } from '@/features/incubate/SolutionDefinition'
import { RiskMitigation } from '@/features/incubate/RiskMitigation'
import { VcThesis } from '@/features/discover/VcThesis'
import { MarketSignals } from '@/features/discover/MarketSignals'
import { OpportunityBrief } from '@/features/discover/OpportunityBrief'
import { Resources } from '@/features/discover/Resources'
import { IncubateLayout } from '@/features/incubate/IncubateLayout'
import { ValidateLayout } from '@/features/validate/ValidateLayout'
import { DesignPartners } from '@/features/validate/DesignPartners'
import { FeedbackSummary } from '@/features/validate/FeedbackSummary'
import { MvpFeatures } from '@/features/validate/MvpFeatures'
import { MvpReadyLayout } from '@/features/mvp-ready/MvpReadyLayout'
import { Architecture } from '@/features/mvp-ready/Architecture'
import { Roadmap } from '@/features/mvp-ready/Roadmap'
import { Business } from '@/features/mvp-ready/Business'
import { FeaturePrds } from '@/features/mvp-ready/FeaturePrds'
import { SprintPlanFeature } from '@/features/mvp-ready/SprintPlan'
import { BuildLayout } from '@/features/build/BuildLayout'
import { ClientFeedback } from '@/features/build/ClientFeedback'
import { RoadmapUpdater } from '@/features/build/RoadmapUpdater'
import { PricingLab } from '@/features/build/PricingLab'
import { CommercialLayout } from '@/features/commercial/CommercialLayout'
import { PricingTracker } from '@/features/commercial/PricingTracker'
import { GtmTracker } from '@/features/commercial/GtmTracker'
import { GtmClientList } from '@/features/commercial/GtmClientList'
import { StageGate } from '@/features/governance/StageGate'
import { STAGE_BASE_PATHS } from '@/constants/stageFeatures'

function isVentureLeadStagePath(pathname: string): boolean {
  if (pathname.startsWith('/discover')) return false
  if (pathname.startsWith('/stage-gate')) return true
  return Object.values(STAGE_BASE_PATHS).some((base) => pathname.startsWith(base))
}

function isFounderFeaturePath(pathname: string): boolean {
  return pathname === '/founder' ||
    pathname.startsWith('/define') ||
    pathname.startsWith('/incubate') ||
    pathname.startsWith('/validate') ||
    pathname.startsWith('/mvp-ready') ||
    pathname.startsWith('/build') ||
    pathname.startsWith('/commercial') ||
    pathname.startsWith('/stage-gate')
}

function LayoutContent() {
  const { pathname } = useLocation()
  const [role] = useRole()

  const isRoleLanding = pathname === '/'
  const showHeaderNav = true
  const showFounderNav = role === 'founder' && isFounderFeaturePath(pathname)
  const showStageNav = role === 'venture-lead' && isVentureLeadStagePath(pathname)
  const showDiscoverNav = role === 'venture-lead' && pathname.startsWith('/discover')

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)]">
      <header
        className="flex items-center justify-between px-6 shrink-0 relative"
        style={{
          height: 56,
          background: 'rgba(19,17,28,0.95)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          zIndex: 100,
        }}
      >
        <Link
          to="/"
          className="font-heading font-bold hover:opacity-90 transition-opacity"
          style={{ fontSize: 18, color: 'var(--accent-primary)', letterSpacing: '-0.02em', textDecoration: 'none' }}
        >
          Venture OS
        </Link>
        {showHeaderNav && (
          <div className="flex items-center gap-4">
            <VentureContextBar />
            <Link
              to="/"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Switch role
            </Link>
            <RolePicker />
          </div>
        )}
      </header>
      {showFounderNav && <FounderNav />}
      {showStageNav && <StageNav />}
      {showDiscoverNav && <DiscoverNav />}
      <main className="flex-1 min-h-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<RoleLanding />} />
          <Route path="/founder" element={<FounderLanding />} />
          <Route path="/venture-lead" element={<VentureLeadDashboard />} />
          {/* Stage 01 - Discover (venture-lead only) */}
          <Route path="/discover" element={<RequireVentureLead><Navigate to="/discover/vc-thesis" replace /></RequireVentureLead>} />
          <Route path="/discover/vc-thesis" element={<RequireVentureLead><VcThesis /></RequireVentureLead>} />
          <Route path="/discover/market-signals" element={<RequireVentureLead><MarketSignals /></RequireVentureLead>} />
          <Route path="/discover/opportunity-brief" element={<RequireVentureLead><OpportunityBrief /></RequireVentureLead>} />
          <Route path="/discover/resources" element={<RequireVentureLead><Resources /></RequireVentureLead>} />
          {/* Stage 02 - Define */}
          <Route path="/define" element={<Navigate to="/define/idea-intake" replace />} />
          <Route path="/define/idea-intake" element={<RequireVenture><IdeaIntake /></RequireVenture>} />
          <Route path="/define/scoring" element={<RequireVenture><Scoring /></RequireVenture>} />
          <Route path="/define/icp" element={<RequireVenture><IcpBuilder /></RequireVenture>} />
          <Route path="/define/competitors" element={<RequireVenture><Competitors /></RequireVenture>} />
          <Route path="/define/business-brief" element={<RequireVenture><Outputs /></RequireVenture>} />
          <Route path="/define/pressure-test" element={<RequireVenture><PressureTest /></RequireVenture>} />
          {/* Stage 03 - Incubate */}
          <Route path="/incubate" element={<RequireVenture><IncubateLayout /></RequireVenture>}>
            <Route index element={<Navigate to="pressure-test" replace />} />
            <Route path="pressure-test" element={<PressureTest />} />
            <Route path="client-list" element={<ClientList />} />
            <Route path="financial-models" element={<FinancialModels />} />
            <Route path="interviews" element={<InterviewInsights />} />
            <Route path="strategy" element={<StrategyMoat />} />
            <Route path="solution" element={<SolutionDefinition />} />
            <Route path="risk" element={<RiskMitigation />} />
            <Route path="outputs" element={<IncubateOutputs />} />
          </Route>
          {/* Stage 04 - Design & Validate */}
          <Route path="/validate" element={<RequireVenture><ValidateLayout /></RequireVenture>}>
            <Route index element={<Navigate to="design-partners" replace />} />
            <Route path="design-partners" element={<DesignPartners />} />
            <Route path="feedback" element={<FeedbackSummary />} />
            <Route path="mvp-features" element={<MvpFeatures />} />
            <Route path="outputs" element={<IncubateOutputs />} />
          </Route>
          {/* Stage 05 - MVP Readiness */}
          <Route path="/mvp-ready" element={<RequireVenture><MvpReadyLayout /></RequireVenture>}>
            <Route index element={<Navigate to="architecture" replace />} />
            <Route path="architecture" element={<Architecture />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="business" element={<Business />} />
            <Route path="prds" element={<FeaturePrds />} />
            <Route path="sprints" element={<SprintPlanFeature />} />
          </Route>
          {/* Stage 06 - Build & Pilot */}
          <Route path="/build" element={<RequireVenture><BuildLayout /></RequireVenture>}>
            <Route index element={<Navigate to="client-feedback" replace />} />
            <Route path="client-feedback" element={<ClientFeedback />} />
            <Route path="roadmap" element={<RoadmapUpdater />} />
            <Route path="pricing-lab" element={<PricingLab />} />
            <Route path="business" element={<Business />} />
          </Route>
          {/* Stage Gate - top-level tab next to Commercial Validation */}
          <Route path="/stage-gate" element={<StageGate />} />
          {/* Stage 07 - Commercial */}
          <Route path="/commercial" element={<RequireVenture><CommercialLayout /></RequireVenture>}>
            <Route index element={<Navigate to="pricing" replace />} />
            <Route path="pricing" element={<PricingTracker />} />
            <Route path="gtm" element={<GtmTracker />} />
            <Route path="client-list" element={<GtmClientList />} />
            <Route path="business" element={<Business />} />
          </Route>
            {/* Legacy redirects */}
            <Route path="/idea-intake" element={<Navigate to="/define/idea-intake" replace />} />
            <Route path="/scoring" element={<Navigate to="/define/scoring" replace />} />
            <Route path="/pressure-test" element={<Navigate to="/define/pressure-test" replace />} />
            <Route path="/outputs" element={<Navigate to="/define/business-brief" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <VentureProvider>
          <DiscoverProvider>
            <LayoutContent />
          </DiscoverProvider>
        </VentureProvider>
      </RoleProvider>
    </BrowserRouter>
  )
}
