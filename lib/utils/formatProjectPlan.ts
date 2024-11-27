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

  return `Project Overview
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
} 