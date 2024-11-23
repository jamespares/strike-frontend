// utils/generateAssets.ts
import OpenAI from 'openai'
import { supabase } from '../lib/supabaseClient'
import { createRoadmapDiagram } from './createRoadmapDiagram'
import { createGanttChart } from './createGanttChart'
import { createBudgetTracker } from './createBudgetTracker'
import { createRiskLog } from './createRiskLog'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface SurveyData {
  key_goals: string
  key_risks: string
  deadline: string
  team_size: number
  budget: number
}

export const generateProjectAssets = async (userId: string, surveyData: SurveyData) => {
  try {
    // First, get AI to analyze the project data with full context
    const response = await openai.chat.completions.create({
      model: 'o1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a project planning assistant that outputs JSON. Consider all project context when breaking down tasks and risks.'
        },
        {
          role: 'user',
          content: `Analyze this project and create a comprehensive breakdown:
          
          Project Goals: ${surveyData.key_goals}
          Key Risks: ${surveyData.key_risks}
          Deadline: ${surveyData.deadline}
          Team Size: ${surveyData.team_size}
          Budget: ${surveyData.budget}

          Consider:
          1. How the goals affect task breakdown and timeline
          2. How risks might impact the budget and schedule
          3. Resource allocation based on team size
          4. Realistic timelines considering the deadline
          
          Provide a detailed breakdown in the specified JSON format.`
        }
      ],
      temperature: 0.7,
    })

    const projectData = JSON.parse(response.choices[0].message.content)

    // Generate all assets with full context
    const diagramUrl = await createRoadmapDiagram(userId, projectData.tasks, surveyData)
    const ganttChartUrl = await createGanttChart(userId, projectData.tasks, surveyData)
    const budgetTrackerUrl = await createBudgetTracker(userId, projectData, surveyData)
    const riskLogUrl = await createRiskLog(userId, projectData.risks, surveyData)

    await supabase
      .from('user_assets')
      .upsert({
        user_id: userId,
        diagram_url: diagramUrl,
        gantt_chart_url: ganttChartUrl,
        budget_tracker_url: budgetTrackerUrl,
        risk_log_url: riskLogUrl,
      }, { onConflict: 'user_id' })

  } catch (error: any) {
    console.error('Error generating project assets:', error.message)
    throw error
  }
}