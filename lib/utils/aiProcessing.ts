// utils/aiProcessing.ts
import { supabase } from '@/lib/clients/supabaseClient'
import { generateProjectAssets } from './generateProjectPlan'

export const triggerAIProcessing = async (userId: string) => {
  // Fetch survey responses
  const { data: surveyData, error: surveyError } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (surveyError || !surveyData) {
    console.error('Error fetching survey data:', surveyError?.message)
    return
  }

  // Fetch user data to get email
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    console.error('Error fetching user data:', userError?.message)
    return
  }

  // Generate assets using AI
  await generateProjectAssets(userId, surveyData)

  // Send email notification
  try {
    await sendEmail(
      userData.email,
      'Your Project Assets Are Ready',
      'Your project assets have been generated and are now available on your dashboard.'
    )
  } catch (error) {
    console.error('Error sending email notification:', error)
  }
}