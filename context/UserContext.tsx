'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Session } from '@supabase/supabase-js'

interface UserContextType {
  session: Session | null
  mounted: boolean
  refreshSession: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserContextProvider({ children }: { children: ReactNode }) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const refreshSession = async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      console.log('Session refresh:', {
        success: !!newSession,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
      if (error) throw error
    } catch (err) {
      console.error('Session refresh failed:', err)
      router.push('/login')
    }
  }

  useEffect(() => {
    const validateAuth = async () => {
      console.group('🔑 Auth Validation')
      try {
        if (mounted && !session && window.location.pathname !== '/login') {
          console.log('Redirecting to login - No session found')
          router.push('/login')
          return
        }

        if (session) {
          console.log('Session State:', {
            exists: true,
            user: {
              id: session.user.id,
              email: session.user.email,
              lastSignIn: session.user.last_sign_in_at
            },
            expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
          })
        }
      } catch (err) {
        console.error('Auth Validation Error:', err)
      } finally {
        setMounted(true)
      }
      console.groupEnd()
    }

    validateAuth()
  }, [session, router, mounted])

  return (
    <UserContext.Provider value={{ session, mounted, refreshSession }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserContextProvider')
  }
  return context
}
