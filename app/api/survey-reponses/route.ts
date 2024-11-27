import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import * as yup from 'yup'

const schema = yup.object().shape({
  userId: yup.string().required(),
  input: yup.object().required(),
})

export async function POST(request: Request) {
  try {
    const { userId, input } = await request.json()
    console.log('Received survey data:', { userId, input })

    await schema.validate({ userId, input })
    console.log('Validation passed')

    const supabase = authService.getSupabaseClient()
    
    // First check if we can query the table
    const { data: checkTable, error: tableError } = await supabase
      .from('survey_responses')
      .select('*')
      .limit(1)

    console.log('Table check:', { checkTable, tableError })

    const { data, error } = await supabase
      .from('survey_responses')
      .upsert({
        user_id: userId,
        ...input,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    console.log('Upsert result:', { data, error })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
} 