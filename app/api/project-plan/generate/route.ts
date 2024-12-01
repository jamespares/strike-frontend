import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/clients/supabaseServer'
import { SurveyData, ProjectPlan } from '@/lib/types/survey'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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
  console.log('Attempting project plan generation, attempt:', attempt)
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
             - Recommend no-code solutions (v0.dev, Bubble.io, etc.)
             - Suggest AI development tools (Github Copilot, etc.)
             - Focus on visual builders and low-code platforms
             - Include SaaS industry revenue benchmarks
             - Add tech scaling patterns (microservices, serverless, etc.)

          2. For physical products/non-tech projects:
             - Focus on traditional project management tools
             - Include manufacturing/retail industry benchmarks
             - Add supply chain scaling recommendations
             - Consider inventory management solutions
             - Include retail/ecommerce revenue patterns

          3. Revenue Predictions:
             - Use real market data and industry averages
             - Consider market size and penetration rates
             - Include competitor pricing analysis
             - Factor in customer acquisition costs
             - Project realistic growth curves

          4. Scaling Recommendations:
             - Provide phase-based growth triggers
             - Include team scaling guidelines
             - Recommend automation opportunities
             - Consider geographical expansion
             - Include infrastructure scaling points`
        },
        {
          role: 'user',
          content: `Create a detailed 5-year business plan starting from ${today}:

Project Overview:
Goals: ${surveyData.key_goals}
Risks: ${surveyData.key_risks}
Deadline: ${surveyData.deadline}
Budget: ${surveyData.budget}

Create a comprehensive plan that includes:

1. Revenue Predictions:
- 5-year revenue forecast with quarterly breakdowns
- Market analysis of competitor pricing
- Customer acquisition cost estimates
- Growth rate assumptions based on industry data
- Profit margin projections

2. Scaling Strategy:
- Clear growth phase triggers
- Team expansion recommendations
- Technology/infrastructure scaling points
- Marketing and sales scaling tactics
- Operational efficiency improvements

3. Risk Analysis & Mitigation:
- Rate risks by probability and impact (LOW/MEDIUM/HIGH)
- For each risk, provide specific tools and automation strategies
- Include proven mitigation tactics from successful indie hackers
- Focus on low-cost, high-impact solutions
- Recommend specific SaaS tools and their costs

4. Task Breakdown:
- Create a critical path of must-have features
- Include clear task dependencies
- For each major task:
  * Prioritize no-code tools like v0.dev for UI, Cursor AI for development
  * Recommend specific no-code platforms (Webflow, Bubble.io, etc.)
  * Include AI-powered development tools (Github Copilot, Amazon CodeWhisperer)
  * Focus on visual builders and low-code solutions
  * Specify time estimates accounting for no-code learning curve
  * List resource requirements and subscription costs

5. Timeline:
- Start from ${today}
- Include major milestones and launch phases
- Account for marketing and user acquisition
- Include buffer time based on risk assessment
- Plan for iterative launches (MVP, beta, full)

6. Budget Allocation:
- Break down by: Development, Marketing, Tools/Services
- Specify one-time vs recurring costs
- Include recommended tools with pricing tiers
- Allocate contingency based on risk assessment
- Focus on tools that maximize ROI for solopreneurs

Use real market data and industry benchmarks to create realistic projections.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })

    console.log('Successfully generated project plan')
    return JSON.parse(response.choices[0].message.content)
  } catch (error: any) {
    console.error('Error generating project plan:', error)
    if (error.code === 'insufficient_quota' && attempt < 3) {
      const backoffTime = Math.pow(2, attempt) * 1000
      console.log(`Retrying after ${backoffTime}ms delay...`)
      await delay(backoffTime)
      return attemptGeneration(surveyData, attempt + 1)
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  console.group('📋 Project Plan Generation')
  try {
    const supabase = createServerClient()
    console.log('Checking authentication...')
    const [
      { data: { user }, error: userError },
      { data: { session }, error: sessionError }
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession()
    ])
    
    console.log('Auth check:', { user: !!user, session: !!session, userError, sessionError })
    
    if (userError || !user || sessionError || !session) {
      console.error('Authentication failed:', { userError, sessionError, timestamp: new Date().toISOString() })
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('Fetching survey data for user:', user.id)
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (surveyError) {
      console.error('Failed to fetch survey data:', surveyError)
      return NextResponse.json({ error: `Error fetching survey responses: ${surveyError.message}` }, { status: 500 })
    }

    console.log('Generating project plan with survey data')
    try {
      const projectPlan = await attemptGeneration(surveyData as SurveyData)
      console.log('Project plan generated successfully')
      
      // First, try to delete any existing plan
      await supabase
        .from('project_plans')
        .delete()
        .eq('user_id', user.id)

      // Then insert the new plan
      const { error: insertError } = await supabase
        .from('project_plans')
        .insert({
          user_id: user.id,
          plan: projectPlan,
        })

      if (insertError) throw insertError

      return NextResponse.json({ success: true, plan: projectPlan })
    } catch (error: any) {
      console.error('Project plan generation error:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error.code || 'unknown_error'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('API Route Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    console.groupEnd()
  }
}
