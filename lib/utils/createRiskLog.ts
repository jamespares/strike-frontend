// utils/createGoogleSheets.ts
import { google } from 'googleapis'
import { supabase } from '@/lib/clients/supabaseClient' 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const createRiskLog = async (userId: string, risks: any[], surveyData: any) => {
  try {
    // Reference to survey questions structure:
    // Reference lines 21-80 in strike/data/surveyQuestions.ts

    const prompt = `Create a Google Apps Script that will build a comprehensive risk management spreadsheet.

    Project Context:
    - Project Goals: ${surveyData.key_goals}
    - Key Risks Identified: ${surveyData.key_risks}
    - Project Timeline: ${surveyData.deadline}
    - Budget at Risk: ${surveyData.budget}
    - Team Size: ${surveyData.team_size}
    
    Risk Details: ${JSON.stringify(risks, null, 2)}

    Requirements:
    1. Create a risk dashboard showing:
       - Risk severity matrix aligned with project goals
       - Impact on key deliverables
       - Timeline of risk mitigation
       - Risk owners and accountability
    2. Include sheets for:
       - Goal-aligned risk register
       - Impact on project objectives
       - Risk-goal correlation matrix
       - Mitigation strategy tracking
    3. Add features for:
       - Risk prioritization based on goal impact
       - Objective-based impact assessment
       - Goal achievement probability
       - Risk response planning
    4. Include risk metrics showing:
       - Impact on key project goals
       - Timeline risk factors
       - Budget impact assessment
    5. Create visualizations for:
       - Risk distribution across goals
       - Impact severity on objectives
       - Mitigation effectiveness
    6. Add automated alerts for:
       - High-impact risks to core goals
       - Cumulative risk effects
       - Mitigation deadlines

    Return only the Google Apps Script code (JavaScript) that creates this spreadsheet.
    Include clear function names and comments.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Google Apps Script and risk management. Output only valid JavaScript code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    })

    const script = response.choices[0].message.content

    const sheetResponse = await fetch('/api/google-sheets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sheetType: 'risks',
        script,
        data: {
          risks,
          goals: surveyData.key_goals,
          keyRisks: surveyData.key_risks,
          deadline: surveyData.deadline,
          budget: surveyData.budget,
          teamSize: surveyData.team_size
        }
      })
    })

    if (!sheetResponse.ok) throw new Error('Failed to create risk log')
    const { spreadsheetUrl } = await sheetResponse.json()
    return spreadsheetUrl

  } catch (error) {
    console.error('Error creating risk log:', error)
    return null
  }
} 