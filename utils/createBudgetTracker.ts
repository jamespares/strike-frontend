import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const createBudgetTracker = async (userId: string, projectData: any, surveyData: any) => {
  try {
    const prompt = `Create a Google Apps Script that will build a comprehensive budget tracking spreadsheet.

    Project Context:
    - Project Goals: ${surveyData.key_goals}
    - Total Budget: ${surveyData.budget}
    - Project Timeline: ${surveyData.deadline}
    - Team Size: ${surveyData.team_size} people
    - Key Risks: ${surveyData.key_risks}
    
    Tasks with Costs: ${JSON.stringify(projectData.tasks, null, 2)}

    Requirements:
    1. Create a budget dashboard showing:
       - Total budget vs allocated/spent
       - Monthly burn rate aligned with project goals
       - Cost per feature/milestone
       - Budget alerts and forecasting
    2. Include sheets for:
       - Goal-based budget allocation
       - Monthly budget tracking
       - Resource cost tracking
       - Risk-adjusted contingency funds
    3. Add formulas for:
       - ROI calculations based on project goals
       - Risk-adjusted budget forecasting
       - Goal completion cost tracking
    4. Create visualizations for:
       - Budget allocation per project goal
       - Risk impact on budget
       - Milestone-based spending
    5. Add automated alerts for:
       - Budget overruns
       - Goal-specific spending limits
       - Risk-triggered contingencies

    Return only the Google Apps Script code (JavaScript) that creates this spreadsheet.
    Include clear function names and comments.`

    const response = await openai.chat.completions.create({
      model: 'o1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Google Apps Script and financial planning. Output only valid JavaScript code.'
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
        sheetType: 'budget',
        script,
        data: {
          tasks: projectData.tasks,
          budget: surveyData.budget,
          deadline: surveyData.deadline,
          teamSize: surveyData.team_size
        }
      })
    })

    if (!sheetResponse.ok) throw new Error('Failed to create budget tracker')
    const { spreadsheetUrl } = await sheetResponse.json()
    return spreadsheetUrl
  } catch (error) {
    console.error('Error creating budget tracker:', error)
    return null
  }
} 