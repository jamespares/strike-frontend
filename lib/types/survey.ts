export interface SurveyData {
  key_goals: string
  key_risks: string
  deadline: string
  budget: number
}

export interface ProjectPlan {
  tasks: ProjectTask[]
  risks: ProjectRisk[]
  timeline: Timeline
  budget: BudgetBreakdown
  revenue: RevenuePrediction
  scaling: ScalingPlan
}

interface ProjectTask {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  dependencies: string[]
  assignedTo: string[]
  estimatedCost: number
}

interface ProjectRisk {
  id: string
  description: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  probability: 'LOW' | 'MEDIUM' | 'HIGH'
  mitigation: string
  contingency: string
}

interface Timeline {
  startDate: string
  endDate: string
  milestones: Array<{
    date: string
    description: string
  }>
}

interface BudgetBreakdown {
  total: number
  breakdown: Record<string, number>
  contingency: number
}

interface RevenuePrediction {
  yearlyPredictions: Array<{
    year: number
    revenue: number
    costs: number
    profit: number
    assumptions: Array<{
      category: string
      description: string
      impact: number
    }>
  }>
  marketAnalysis: {
    averageCompetitorPricing: number
    marketSize: string
    targetMarketShare: number
    keyMetrics: Array<{
      name: string
      value: string
      description: string
    }>
  }
}

interface ScalingPlan {
  phases: Array<{
    name: string
    trigger: string
    recommendations: Array<{
      category: 'TEAM' | 'TECH' | 'MARKETING' | 'OPERATIONS'
      action: string
      timing: string
      estimatedCost: number
      expectedImpact: string
    }>
    keyMetrics: Array<{
      metric: string
      target: string
    }>
  }>
  industryBenchmarks: Array<{
    metric: string
    benchmark: string
    source: string
  }>
}

// Add other necessary interfaces...
