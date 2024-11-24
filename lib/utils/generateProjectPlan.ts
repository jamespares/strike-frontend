// utils/generateAssets.ts
import { openai } from '@/lib/clients/openaiClient'
import { supabase } from '@/lib/clients/supabaseClient'
import { generateRoadmapDiagram } from './createRoadmapDiagram'
import { generateGanttChart, generateGanttCSV } from './createGanttChart'
import { generateBudgetTracker, generateBudgetCSV } from './createBudgetTracker'
import { generateRiskLog, generateRiskCSV } from './createRiskLog'
import { AssetGenerationStatus } from '@/lib/types/assets'

interface SurveyData {
  key_goals: string
  key_risks: string
  deadline: string
  budget: number
}

async function generateProjectPlan(surveyData: SurveyData) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a project planning assistant that outputs JSON.'
      },
      {
        role: 'user',
        content: `Analyze this project and create a comprehensive breakdown:
          Project Goals: ${surveyData.key_goals}
          Key Risks: ${surveyData.key_risks}
          Deadline: ${surveyData.deadline}
          Budget: ${surveyData.budget}
          
          Consider:
          1. How the goals affect task breakdown and timeline
          2. How risks might impact the budget and schedule
          3. Realistic timelines considering the deadline
          
          Provide a detailed breakdown in JSON format with tasks, risks, and timeline.`
      }
    ]
  })

  return JSON.parse(response.choices[0].message.content)
}

export const generateProjectAssets = async (userId: string, surveyData: SurveyData) => {
  const assets = {
    roadmap_url: null,
    gantt_chart_url: null,
    gantt_csv_url: null,
    budget_tracker_url: null,
    budget_csv_url: null,
    risk_log_url: null,
    risk_csv_url: null
  }

  const updateStatus = async (status: AssetGenerationStatus) => {
    await supabase
      .from('user_assets')
      .upsert({ 
        user_id: userId, 
        generation_status: status 
      })
  }

  const logError = async (error: Error, step: AssetGenerationStatus) => {
    await supabase
      .from('user_assets')
      .upsert({ 
        user_id: userId,
        generation_status: AssetGenerationStatus.FAILED,
        error_log: {
          step,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      })
  }

  try {
    // Generate project plan
    await updateStatus(AssetGenerationStatus.GENERATING_PLAN)
    const projectPlan = await generateProjectPlan(surveyData)

    // Define all asset generators
    const generators = [
      { 
        status: AssetGenerationStatus.GENERATING_GANTT,
        fn: () => generateGanttChart(userId, projectPlan.tasks, surveyData),
        key: 'gantt_chart_url'
      },
      {
        status: AssetGenerationStatus.GENERATING_GANTT_CSV,
        fn: () => generateGanttCSV(projectPlan.tasks),
        key: 'gantt_csv_url'
      },
      {
        status: AssetGenerationStatus.GENERATING_BUDGET,
        fn: () => generateBudgetTracker(userId, projectPlan, surveyData),
        key: 'budget_tracker_url'
      },
      {
        status: AssetGenerationStatus.GENERATING_BUDGET_CSV,
        fn: () => generateBudgetCSV(projectPlan),
        key: 'budget_csv_url'
      },
      {
        status: AssetGenerationStatus.GENERATING_RISK,
        fn: () => generateRiskLog(userId, projectPlan.risks, surveyData),
        key: 'risk_log_url'
      },
      {
        status: AssetGenerationStatus.GENERATING_RISK_CSV,
        fn: () => generateRiskCSV(projectPlan.risks),
        key: 'risk_csv_url'
      },
      {
        status: AssetGenerationStatus.GENERATING_ROADMAP,
        fn: () => generateRoadmapDiagram(userId, projectPlan.tasks, surveyData),
        key: 'roadmap_url'
      }
    ]

    for (const generator of generators) {
      await updateStatus(generator.status)
      try {
        const result = await generator.fn()
        if (result) {
          assets[generator.key] = result
          await supabase
            .from('user_assets')
            .upsert({
              user_id: userId,
              [generator.key]: result
            })
        }
      } catch (err: any) {
        console.error(`Error generating ${generator.key}:`, err)
        throw new Error(`Failed to generate ${generator.key}`)
      }
    }

    await supabase
      .from('user_assets')
      .upsert({
        user_id: userId,
        ...assets,
        generation_status: AssetGenerationStatus.COMPLETED
      })

    return assets
  } catch (error: any) {
    console.error('Asset generation failed:', error)
    await logError(error, AssetGenerationStatus.FAILED)
    throw error
  }
}