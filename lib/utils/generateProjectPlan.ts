// utils/generateAssets.ts
import { openai } from '@/lib/clients/openaiClient'
import { SurveyData, ProjectPlan } from '@/lib/types/survey'

export async function generateProjectPlan(surveyData: SurveyData): Promise<ProjectPlan> {
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