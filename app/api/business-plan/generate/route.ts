import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { supabase } from '@/lib/clients/supabaseClient'

interface SurveyResponse {
  problem: string
  key_risks: string
  deadline: string
  budget: string | number
  pricing_model: string
}

interface BusinessPlanSection {
  title: string
  content: string | string[]
  metrics?: {
    label: string
    value: string | number
    unit?: string
  }[]
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from Supabase using email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { responses, questions } = await request.json() as {
      responses: SurveyResponse
      questions: SurveyQuestion[]
    }

    if (!responses || !questions) {
      return NextResponse.json(
        { error: 'Survey responses and questions are required' },
        { status: 400 }
      )
    }

    const prompt = `Create a detailed business plan based on the following survey responses:
      Problem: ${responses.problem}
      Key Risks: ${responses.key_risks}
      Timeline: ${responses.deadline}
      Budget: $${responses.budget}
      Revenue Model: ${responses.pricing_model}
      
      Format the response as a business plan with sections for:
      - Executive Summary
      - Market Analysis
      - Business Model
      - Financial Projections
      
      Include relevant metrics and KPIs where appropriate.
      Make it detailed but concise, focusing on key information investors need.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content generated from OpenAI')
    }

    const businessPlan = JSON.parse(content) as { sections: BusinessPlanSection[] }

    // Store in user_assets table
    const { data: asset, error: dbError } = await supabase
      .from('user_assets')
      .insert({
        user_id: userData.id,
        asset_type: 'business_plan',
        title: 'Business Plan',
        content: businessPlan,
        status: 'completed',
        last_updated: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    return NextResponse.json({
      ...businessPlan,
      assetId: asset.id,
      message: 'Business plan generated successfully',
    })
  } catch (error: any) {
    console.error('Error generating business plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate business plan' },
      { status: 500 }
    )
  }
} 