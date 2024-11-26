import { NextResponse } from 'next/server'
import { supabase } from '@/lib/clients/supabaseClient'
import { generateProjectPlan } from '@/lib/utils/generateProjectPlan'
import { SurveyData } from '@/lib/types/survey'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    console.log('Attempting to generate plan for user:', userId)

    // Fetch survey responses
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('Survey query result:', {
      data: surveyData,
      error: surveyError
    })

    if (surveyError || !surveyData) {
      throw new Error('Survey responses not found')
    }

    // Validate survey data has required fields
    if (!surveyData.key_goals || !surveyData.key_risks || 
        !surveyData.deadline || !surveyData.budget) {
      throw new Error('Incomplete survey responses')
    }

    // Generate project plan
    const projectPlan = await generateProjectPlan(surveyData as SurveyData)
    console.log('Generated plan:', projectPlan)

    // Store in Supabase
    const { error } = await supabase
      .from('project_plans')
      .upsert({
        user_id: userId,
        plan: projectPlan,
      }, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({ success: true, plan: projectPlan })
  } catch (error: any) {
    console.error('Project plan generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 