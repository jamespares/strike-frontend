import { openai } from '@/lib/clients/openaiClient'
import { ProjectPlan } from '@/lib/types/survey'

export async function generatePitchDeckContent(projectPlan: ProjectPlan) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert pitch deck consultant. Generate content for a pitch deck following 
          Sequoia Capital's recommended structure. Use the provided project plan data and make realistic 
          assumptions where needed. Return a JSON object with content for each slide.
          
          Guidelines:
          1. Keep content concise and impactful
          2. Use realistic market sizes and growth projections
          3. Focus on compelling narrative
          4. Include specific metrics where available
          5. Make reasonable assumptions based on industry data
          
          Return ONLY a valid JSON object without any markdown formatting or backticks.`
        },
        {
          role: 'user',
          content: `Generate pitch deck content using this project plan:
          ${JSON.stringify(projectPlan, null, 2)}
          
          Return a JSON object with these keys:
          - companyPurpose
          - problem
          - solution
          - whyNow
          - marketSize
          - competition
          - product
          - businessModel
          - team
          - financials`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    let content = response.choices[0].message.content || '{}'
    
    // Clean the response similar to generateRoadmap.ts
    content = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    return JSON.parse(content)
  } catch (error) {
    console.error('Error generating pitch deck content:', error)
    throw error
  }
} 