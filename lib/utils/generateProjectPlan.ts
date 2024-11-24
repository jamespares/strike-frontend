// utils/generateAssets.ts
import { openai } from '@/lib/clients/openaiClient'
import { supabase } from '@/lib/clients/supabaseClient'
import { createRoadmapDiagram } from './createRoadmapDiagram'
import { createGanttChart } from './createGanttChart'
import { createBudgetTracker } from './createBudgetTracker'
import { createRiskLog } from './createRiskLog'

interface SurveyData {
  key_goals: string
  key_risks: string
  deadline: string
  budget: number
}

export const generateProjectAssets = async (userId: string, surveyData: SurveyData) => {
  try {
    // First, get AI to analyze the project data with full context
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a project planning assistant that outputs JSON in the following format:
          {
            "tasks": [
              {
                "id": "string",
                "title": "string",
                "description": "string",
                "startDate": "YYYY-MM-DD",
                "endDate": "YYYY-MM-DD",
                "dependencies": ["taskId"],
                "assignedTo": ["string"],
                "estimatedCost": number
              }
            ],
            "risks": [
              {
                "id": "string",
                "description": "string",
                "impact": "LOW" | "MEDIUM" | "HIGH",
                "probability": "LOW" | "MEDIUM" | "HIGH",
                "mitigation": "string",
                "contingency": "string"
              }
            ],
            "timeline": {
              "startDate": "YYYY-MM-DD",
              "endDate": "YYYY-MM-DD",
              "milestones": [
                {
                  "date": "YYYY-MM-DD",
                  "description": "string"
                }
              ]
            },
            "budget": {
              "total": number,
              "breakdown": {
                "category": number
              },
              "contingency": number
            }
          }`
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
          
          Provide a detailed breakdown in the specified JSON format.`
        }
      ],
      temperature: 0.7,
    })

    const projectData = JSON.parse(response.choices[0].message.content)

    // Store AI-generated project plan
    const { error: planError } = await supabase
      .from('project_plans')
      .upsert({
        user_id: userId,
        plan: projectData,
      }, { onConflict: 'user_id' })

    if (planError) {
      console.error('Error storing project plan:', planError.message)
      throw planError
    }

    // Generate all assets with full context
    const [diagramUrl, ganttChartUrl, budgetTrackerUrl, riskLogUrl] = await Promise.all([
      createRoadmapDiagram(userId, projectData.tasks, surveyData).catch(error => {
        console.error('Error creating roadmap:', error);
        return null;
      }),
      createGanttChart(userId, projectData.tasks, surveyData).catch(error => {
        console.error('Error creating Gantt chart:', error);
        return null;
      }),
      createBudgetTracker(userId, projectData, surveyData).catch(error => {
        console.error('Error creating budget tracker:', error);
        return null;
      }),
      createRiskLog(userId, projectData.risks, surveyData).catch(error => {
        console.error('Error creating risk log:', error);
        return null;
      })
    ]);

    // Only update assets that were successfully generated
    const assetsToUpdate: Record<string, string | null> = {
      user_id: userId,
      ...(diagramUrl && { diagram_url: diagramUrl }),
      ...(ganttChartUrl && { gantt_chart_url: ganttChartUrl }),
      ...(budgetTrackerUrl && { budget_tracker_url: budgetTrackerUrl }),
      ...(riskLogUrl && { risk_log_url: riskLogUrl })
    };

    const { error: assetError } = await supabase
      .from('user_assets')
      .upsert(assetsToUpdate, { onConflict: 'user_id' });

    if (assetError) {
      console.error('Error storing asset URLs:', assetError);
      throw assetError;
    }

  } catch (error: any) {
    console.error('Error generating project assets:', error.message)
    throw error
  }
}