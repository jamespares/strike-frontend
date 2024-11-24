import { supabase } from '@/lib/clients/supabaseClient'

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  })
  if (error) console.error('Error signing in:', error.message)
}

export const signInWithEmail = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) console.error('Error signing in:', error.message)
  return { error }
}

export const signUpWithEmail = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`
    }
  })
  if (error) console.error('Error signing up:', error.message)
  return { error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Error signing out:', error.message)
}