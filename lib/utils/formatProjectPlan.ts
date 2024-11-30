import { ProjectPlan } from '@/lib/types/survey'

export function formatProjectPlanToText(plan: ProjectPlan): string {
  if (!plan) return ''

  const formatCurrency = (amount: number = 0) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatRisks = () => {
    if (!plan.risks?.length) return '\nNo risks identified.'
    
    return plan.risks.map(risk => `
${risk.description}
• Impact: ${risk.impact}
• Probability: ${risk.probability}
• Mitigation: ${risk.mitigation}
• Contingency: ${risk.contingency}`
    ).join('\n\n')
  }

  const formatTasks = () => {
    if (!plan.tasks?.length) return '\nNo tasks defined.'
    
    // Create a map of task IDs to titles for dependency lookup
    const taskMap = plan.tasks.reduce((acc, task) => {
      acc[task.id] = task.title
      return acc
    }, {} as Record<string, string>)
    
    return plan.tasks.map(task => `
${task.title}
• Duration: ${task.startDate} to ${task.endDate}
• Description: ${task.description}
• Dependencies: ${task.dependencies?.length 
  ? task.dependencies.map(dep => taskMap[dep] || dep).join(', ') 
  : 'None'}
• Cost: ${formatCurrency(task.estimatedCost)}`
    ).join('\n\n')
  }

  const formatMilestones = () => {
    if (!plan.timeline?.milestones?.length) return '\nNo milestones set.'
    
    return plan.timeline.milestones
      .map(m => `• ${m.date}: ${m.description}`)
      .join('\n')
  }

  const formatBudget = () => {
    const budget = plan.budget || {}
    const breakdown = budget.breakdown || {}
    return Object.entries(breakdown)
      .map(([category, amount]) => `${category}: ${formatCurrency(amount)}`)
      .join('\n')
  }

  const formatRevenuePredictions = () => {
    if (!plan.revenue?.yearlyPredictions?.length) return '\nNo revenue predictions available.'
    
    return plan.revenue.yearlyPredictions.map(year => `
Year ${year.year}
• Revenue: ${formatCurrency(year.revenue)}
• Costs: ${formatCurrency(year.costs)}
• Profit: ${formatCurrency(year.profit)}
• Key Assumptions:
${year.assumptions.map(a => `  - ${a.category}: ${a.description} (Impact: ${formatCurrency(a.impact)})`).join('\n')}`
    ).join('\n\n')
  }

  const formatScalingPlan = () => {
    if (!plan.scaling?.phases?.length) return '\nNo scaling plan available.'
    
    return plan.scaling.phases.map(phase => `
${phase.name}
• Trigger: ${phase.trigger}
• Recommendations:
${phase.recommendations.map(r => `  - [${r.category}] ${r.action}
    Timing: ${r.timing}
    Cost: ${formatCurrency(r.estimatedCost)}
    Impact: ${r.expectedImpact}`).join('\n')}
• Key Metrics:
${phase.keyMetrics.map(m => `  - ${m.metric}: ${m.target}`).join('\n')}`
    ).join('\n\n')
  }

  const existingFormattedText = `Project Overview
────────────────
Start Date: ${plan.timeline?.startDate || 'Not set'}
End Date: ${plan.timeline?.endDate || 'Not set'}
Total Budget: ${formatCurrency(plan.budget?.total)}
Goals: ${plan.goals || 'Not set'}

Key Risks
─────────${formatRisks()}

Tasks
─────${formatTasks()}

Timeline
────────
${formatMilestones()}
Buffer: ${plan.timeline?.buffer || 'None'}

Budget Breakdown
───────────────
${formatBudget()}
Contingency: ${formatCurrency(plan.budget?.contingency || 0)}
Total Allocated: ${formatCurrency(plan.budget?.total || 0)}`

  return `${existingFormattedText}

Revenue Predictions (5 Year)
──────────────────────────${formatRevenuePredictions()}

Scaling Strategy
───────────────${formatScalingPlan()}

Industry Benchmarks
─────────────────
${plan.scaling?.industryBenchmarks.map(b => `• ${b.metric}: ${b.benchmark} (Source: ${b.source})`).join('\n')}`
} 