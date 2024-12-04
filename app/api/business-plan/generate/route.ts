import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SurveyQuestion } from '@/data/surveyQuestions'

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
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Create initial asset record
    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .insert({
        user_id: session.user.id,
        asset_type: 'business_plan',
        title: 'Business Plan',
        status: 'generating',
        content: null
      })
      .select()
      .single()

    if (assetError) {
      console.error('Error creating asset record:', assetError)
      return NextResponse.json(
        { error: 'Failed to initialize asset generation' },
        { status: 500 }
      )
    }

    // Generate business plan content using OpenAI
    const prompt = `Create a detailed business plan based on:
    Problem: ${responses.problem}
    Key Risks: ${responses.key_risks}
    Timeline: ${responses.deadline}
    Budget: $${responses.budget}
    Revenue Model: ${responses.pricing_model}
    
    Format the response as a JSON object with sections array containing:
    - Executive Summary
    - Problem Statement
    - Solution Overview
    - Market Analysis
    - Business Model
    - Financial Projections
    - Risk Analysis
    - Implementation Timeline
    
    Each section should have:
    - title: string
    - content: string[] (bullet points)
    - metrics: (optional) array of { label, value, unit }`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content generated from OpenAI')
    }

    const businessPlan = JSON.parse(content)

    // Update the asset record with the generated content
    const { error: updateError } = await supabase
      .from('user_assets')
      .update({
        content: businessPlan,
        status: 'completed'
      })
      .eq('id', asset.id)

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    return NextResponse.json({
      message: 'Business plan generated successfully',
      assetId: asset.id,
      ...businessPlan
    })
  } catch (error: any) {
    console.error('Error generating business plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate business plan' },
      { status: 500 }
    )
  }
} 