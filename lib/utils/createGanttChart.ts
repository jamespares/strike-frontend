import OpenAI from 'openai'
import { supabase } from '@/lib/clients/supabaseClient'
import { google } from 'googleapis'
import { createGoogleSheets } from './createGoogleSheets'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const createGanttChart = async (userId: string, tasks: any[], surveyData: any) => {
  try {
    const prompt = `Create a Google Apps Script that will build a professional Gantt chart spreadsheet.
    
    Project Context:
    - Project Goals: ${surveyData.key_goals}
    - Deadline: ${surveyData.deadline}
    - Budget: ${surveyData.budget}
    - Key Risks: ${surveyData.key_risks}
    
    Tasks to include: ${JSON.stringify(tasks, null, 2)}

    Requirements:
    1. Create a professional Gantt chart that shows task dependencies and aligns with project goals
    2. Add timeline visualization with milestone markers for key deliverables
    3. Include resource allocation based on team size and skills needed
    4. Add progress tracking with status indicators
    5. Create a dashboard summary showing:
       - Progress towards key goals
       - Resource utilization
       - Critical path tasks
       - Risk impact on timeline
    6. Add conditional formatting for:
       - Tasks at risk
       - Critical path items
       - Goal-related milestones
    7. Include data validation
    8. Add automated notifications for timeline risks

    Return only the Google Apps Script code (JavaScript) that creates this spreadsheet.
    Include clear function names and comments.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use a more capable model if needed
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Google Apps Script and project management. Output only valid JavaScript code.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    const script = response.choices[0].message.content

    // Create spreadsheet with script
    const spreadsheetUrl = await createGoogleSheets(userId, {
      sheetType: 'gantt',
      script,
      tasks,
      surveyData,
    })

    return spreadsheetUrl
  } catch (error) {
    console.error('Error creating Gantt chart:', error)
    return null
  }
} 