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
          2. Use consistent rectangular nodes with explicit styling: [Phase Name<br><i>Start: MM/DD/YY</i>]:::milestone
          3. Connect nodes with straight arrows using -->
          4. Dates should be in MM/DD/YY format
          5. Each node must be directly connected to the next phase only
          6. No crossing or curved arrows
          7. Maximum 8 nodes for clarity
          8. Nodes should be aligned horizontally in chronological order
          9. Add this classDef at the start: classDef milestone fill:#fef3c7,stroke:#334155,stroke-width:2px
          10. Create nodes ONLY from the project plan's tasks, using their titles and start dates
          11. Sort tasks chronologically by start date
          12. Group related tasks if needed to stay under 8 nodes`
        },
        {
          role: 'user',
          content: `Create a Mermaid.js flowchart using ONLY these tasks from the project plan:
          ${JSON.stringify(projectPlan.tasks.map(task => ({
            title: task.title,
            startDate: task.startDate,
            dependencies: task.dependencies
          })), null, 2)}
          
          Ensure the flow matches the task dependencies and chronological order.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    let mermaidCode = response.choices[0].message.content || ''
    
    // Clean the response
    mermaidCode = mermaidCode
      .replace(/```mermaid\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    return mermaidCode
  } catch (error) {
    console.error('Error generating roadmap:', error)
    throw error
  }
} 