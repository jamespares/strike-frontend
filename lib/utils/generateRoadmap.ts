import { ProjectPlan } from '@/lib/types/survey'
import { openai } from '@/lib/clients/openaiClient'

export async function generateRoadmap(projectPlan: ProjectPlan): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a technical diagram expert. Create a Mermaid.js flowchart diagram.
          Return ONLY the Mermaid.js code without any markdown formatting, explanation, or backticks.
          
          Rules for a professional project timeline:
          1. Use flowchart LR (left to right) direction
          2. Use consistent rectangular nodes with explicit styling: [Phase Name<br><i>MM/DD/YY - MM/DD/YY</i>]:::milestone
          3. Connect nodes with straight arrows using -->
          4. Dates should be in MM/DD/YY format
          5. Each node must be directly connected to the next phase only
          6. No crossing or curved arrows
          7. Maximum 8 nodes for clarity
          8. Nodes should be aligned horizontally in chronological order
          9. Add this classDef at the start: classDef milestone fill:#fef3c7,stroke:#334155,stroke-width:2px`
        },
        {
          role: 'user',
          content: `Create a Mermaid.js flowchart for this project plan:
          Start Date: ${projectPlan.timeline.startDate}
          End Date: ${projectPlan.timeline.endDate}
          Milestones: ${JSON.stringify(projectPlan.timeline.milestones)}
          Tasks: ${JSON.stringify(projectPlan.tasks)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    let mermaidCode = response.choices[0].message.content || ''
    console.log('Raw OpenAI response:', mermaidCode)

    // Clean the response to extract only the Mermaid code
    mermaidCode = mermaidCode
      .replace(/```mermaid\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^Here is.*?\n/g, '')
      .trim()

    console.log('Cleaned mermaid code:', mermaidCode)

    return mermaidCode
  } catch (error) {
    console.error('Error generating roadmap:', error)
    throw error
  }
} 