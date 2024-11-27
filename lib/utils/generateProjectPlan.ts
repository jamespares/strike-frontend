// utils/generateAssets.ts
import { openai } from '@/lib/clients/openaiClient'
import { SurveyData, ProjectPlan } from '@/lib/types/survey'

const projectPlanInterface = `interface ProjectPlan {
  goals: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    dependencies: string[];
    assignedTo: string[];
    estimatedCost: number;
  }>;
  risks: Array<{
    id: string;
    description: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    probability: 'LOW' | 'MEDIUM' | 'HIGH';
    mitigation: string;
    contingency: string;
  }>;
  timeline: {
    startDate: string;
    endDate: string;
    milestones: Array<{
      date: string;
      description: string;
    }>;
  };
  budget: {
    total: number;
    breakdown: Record<string, number>;
    contingency: number;
  };
}`

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function attemptGeneration(surveyData: SurveyData, attempt: number = 1): Promise<ProjectPlan> {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert project planning assistant for indie hackers and solopreneurs.
          You must return a JSON object that exactly matches this TypeScript interface:

          ${projectPlanInterface}

          Important Guidelines:
          1. For software/tech projects:
             - Strongly recommend no-code solutions (v0.dev, Bubble.io, etc.)
             - Suggest AI development tools (Github Copilot, etc.)
             - Focus on visual builders and low-code platforms

          2. For physical products/non-tech projects:
             - Focus on traditional project management tools
             - Recommend relevant industry-specific tools
             - Avoid suggesting software development platforms

          Analyze the project goals first and tailor your recommendations accordingly.`
        },
        {
          role: 'user',
          content: `Create a detailed solopreneur-focused project plan starting from ${today}:

Project Overview:
Goals: ${surveyData.key_goals}
Risks: ${surveyData.key_risks}
Deadline: ${surveyData.deadline}
Budget: ${surveyData.budget}

Create a comprehensive plan optimized for a solo founder that includes:

1. Risk Analysis & Mitigation:
- Rate risks by probability and impact (LOW/MEDIUM/HIGH)
- For each risk, provide specific tools and automation strategies
- Include proven mitigation tactics from successful indie hackers
- Focus on low-cost, high-impact solutions
- Recommend specific SaaS tools and their costs

2. Task Breakdown:
- Create a critical path of must-have features
- Include clear task dependencies
- For each major task:
  * Prioritize no-code tools like v0.dev for UI, Cursor AI for development
  * Recommend specific no-code platforms (Webflow, Bubble.io, etc.)
  * Include AI-powered development tools (Github Copilot, Amazon CodeWhisperer)
  * Focus on visual builders and low-code solutions
  * Specify time estimates accounting for no-code learning curve
  * List resource requirements and subscription costs

3. Timeline:
- Start from ${today}
- Include major milestones and launch phases
- Account for marketing and user acquisition
- Include buffer time based on risk assessment
- Plan for iterative launches (MVP, beta, full)

4. Budget Allocation:
- Break down by: Development, Marketing, Tools/Services
- Specify one-time vs recurring costs
- Include recommended tools with pricing tiers
- Allocate contingency based on risk assessment
- Focus on tools that maximize ROI for solopreneurs

Remember to prioritize automation, efficiency, and proven tools that help solopreneurs move fast and reduce risks.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })

    return JSON.parse(response.choices[0].message.content)
  } catch (error: any) {
    if (error.code === 'insufficient_quota' && attempt < 3) {
      const backoffTime = Math.pow(2, attempt) * 1000
      await delay(backoffTime)
      return attemptGeneration(surveyData, attempt + 1)
    }
    throw error
  }
}

export async function generateProjectPlan(surveyData: SurveyData): Promise<ProjectPlan> {
  return attemptGeneration(surveyData)
}