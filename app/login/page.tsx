'use client'

import { useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e] text-white [color-scheme:dark]">
      <div className="w-full max-w-md bg-[#232a3b] p-8 rounded-xl shadow-md border border-amber-900/30 [color-scheme:dark]">
        <h1 className="text-2xl font-bold mb-6 text-center text-amber-500">Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 bg-[#1a1f2e] rounded-xl border border-amber-500/30 
                         text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 bg-[#1a1f2e] rounded-xl border border-amber-500/30 
                         text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700
                       text-white rounded-xl font-semibold hover:from-amber-700 hover:to-amber-800
                       transition duration-200"
          >
            Login
          </button>
        </form>
        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-amber-500/30"></div>
          <span className="px-4 text-amber-500/60">or</span>
          <div className="flex-1 border-t border-amber-500/30"></div>
        </div>
        <button
          onClick={signInWithGoogle}
          className="w-full px-4 py-2 bg-white text-gray-800 rounded-xl font-semibold
                     flex items-center justify-center gap-2 hover:bg-gray-100 transition duration-200"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
