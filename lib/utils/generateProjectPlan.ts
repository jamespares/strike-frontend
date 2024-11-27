// utils/generateAssets.ts
import { openai } from '@/lib/clients/openaiClient'
import { SurveyData, ProjectPlan } from '@/lib/types/survey'

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function attemptGeneration(surveyData: SurveyData, attempt: number = 1): Promise<ProjectPlan> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    return JSON.parse(response.choices[0].message.content)
  } catch (error: any) {
    if (error.code === 'insufficient_quota' && attempt < 3) {
      const backoffTime = Math.pow(2, attempt) * 1000 // exponential backoff
      await delay(backoffTime)
      return attemptGeneration(surveyData, attempt + 1)
    }
    throw error
  }
}

export async function generateProjectPlan(surveyData: SurveyData): Promise<ProjectPlan> {
  try {
    return await attemptGeneration(surveyData)
  } catch (error: any) {
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please try again in a few minutes.')
    }
    throw error
  }
}