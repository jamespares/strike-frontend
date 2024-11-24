import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import * as yup from 'yup'

const schema = yup.object().shape({
  userId: yup.string().required(),
  input: yup.object().required(),
})

export async function POST(request: Request) {
  try {
    const { userId, input } = await request.json()
    console.log('Received data:', { userId, input })

    await schema.validate({ userId, input })
    console.log('Validation passed')

    // Get authenticated Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    const { data, error } = await supabase
      .from('survey_responses')
      .upsert({
        user_id: userId,
        ...input
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Data saved successfully')
    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    console.error('API route error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
} 