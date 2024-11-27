import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/clients/supabaseServer'
import { generateProjectPlan } from '@/lib/utils/generateProjectPlan'
import { SurveyData } from '@/lib/types/survey'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.group('🔒 API Authentication Check')
  try {
    const supabase = createServerClient()
    console.log('Supabase client created')
    
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
      const projectPlan = await generateProjectPlan(surveyData as SurveyData)
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
