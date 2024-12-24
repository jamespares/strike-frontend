'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 relative inline-block">
          Sign Up
          <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 transform -rotate-1 translate-y-1"></div>
        </h1>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 
                       text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 
                       text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg text-sm font-medium
                     hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                     transition duration-200 ease-in-out shadow-sm"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>
        <button
          onClick={handleGoogleSignUp}
          className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-lg 
                   text-sm font-medium hover:bg-gray-50 transform hover:scale-105 active:scale-95
                   transition duration-200 ease-in-out shadow-sm flex items-center justify-center gap-2"
          disabled={loading}
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Sign up with Google
        </button>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
