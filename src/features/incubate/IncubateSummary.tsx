import type { Venture } from '@/types/venture'
import { StageProgressSummary } from '@/components/StageProgressSummary'

function getIncubateStatus(venture: Venture) {
  return [
    { label: 'Pressure Test', done: !!(venture.pressureTests?.length), path: '/incubate/pressure-test' },
    {
      label: 'Financial Models',
      done: !!(venture.financialModels?.mvpCost || venture.financialModels?.unitEconomics || venture.financialModels?.marketSizing),
      path: '/incubate/financial-models',
    },
    { label: 'Interview Insights', done: !!(venture.interviews?.uploads?.length), path: '/incubate/interviews' },
    { label: 'Strategy & Moat', done: !!venture.strategyMoat?.assessment, path: '/incubate/strategy' },
    { label: 'Solution', done: !!venture.solutionDefinition, path: '/incubate/solution' },
    { label: 'Risk Mitigation', done: !!(venture.riskRegister?.risks?.length), path: '/incubate/risk' },
    { label: 'Client List', done: !!(venture.clientList?.entries?.length), path: '/incubate/client-list' },
    { label: 'Outputs', done: !!(venture.investmentMemo || venture.pitchDeck), path: '/incubate/outputs' },
  ]
}

export function IncubateSummary({ venture }: { venture: Venture }) {
  return <StageProgressSummary title="Incubate Progress" items={getIncubateStatus(venture)} />
}
