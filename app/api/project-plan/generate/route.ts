import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateProjectPlan } from '@/lib/utils/generateProjectPlan'
import { SurveyData } from '@/lib/types/survey'

export async function POST(request: NextRequest) {
  console.group('🔒 API Authentication Check')
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (error || !session) {
      console.error('Authentication failed:', { error, timestamp: new Date().toISOString() })
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('Authenticated user:', {
      id: session.user.id,
      email: session.user.email,
      lastSignIn: session.user.last_sign_in_at
    })

    // Rest of your existing logic, starting from line 58
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (surveyError) {
      console.error('Failed to fetch survey data:', surveyError)
      return NextResponse.json({ error: `Error fetching survey responses: ${surveyError.message}` }, { status: 500 })
    }

    // Your existing validation and processing logic
    const projectPlan = await generateProjectPlan(surveyData as SurveyData)

    const { error: upsertError } = await supabase
      .from('project_plans')
      .upsert({
        user_id: session.user.id,
        plan: projectPlan,
      }, { onConflict: 'user_id' })

    if (upsertError) throw upsertError

    return NextResponse.json({ success: true, plan: projectPlan })
  } catch (error: any) {
    console.error('API Route Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    console.groupEnd()
  }
}
