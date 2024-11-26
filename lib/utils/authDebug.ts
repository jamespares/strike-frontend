import { supabase } from '@/lib/clients/supabaseClient'

export const debugAuthConfig = async () => {
  console.group('🔐 Auth Configuration Debug')
  try {
    // Check Supabase client configuration
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

    // Test session persistence
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session Test:', {
      hasSession: !!session,
      error: sessionError?.message,
      persistenceType: typeof window !== 'undefined' ? localStorage.getItem('supabase.auth.token') ? 'localStorage' : 'none' : 'server'
    })

    // Test RLS policies
    const { data: testData, error: rlsError } = await supabase
      .from('survey_responses')
      .select('count')
      .limit(1)
    
    console.log('RLS Test:', {
      success: !rlsError,
      error: rlsError?.message,
      hint: rlsError?.hint,
      details: rlsError?.details
    })

  } catch (err) {
    console.error('Auth Debug Error:', err)
  }
  console.groupEnd()
} 