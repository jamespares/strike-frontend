'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Session not established after login')
      }

      console.log('Login successful:', {
        email: session.user.email,
        sessionExists: !!session,
      })

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signInError) throw signInError
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during Google login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 relative inline-block">
          Login
          <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 transform -rotate-1 translate-y-1"></div>
        </h1>
        <form onSubmit={handleEmailLogin} className="space-y-4">
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-lg 
                   text-sm font-medium hover:bg-gray-50 transform hover:scale-105 active:scale-95
                   transition duration-200 ease-in-out shadow-sm flex items-center justify-center gap-2"
          disabled={loading}
        >
          <Image
            src="https://www.google.com/favicon.ico"
            alt="Google"
            width={20}
            height={20}
            className="w-5 h-5"
          />
          Sign in with Google
        </button>
        <p className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-emerald-600 hover:text-emerald-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
