'use client'

import { useState } from 'react'
import { signInWithGoogle } from '@/lib/auth/auth'
import { supabase } from '@/lib/clients/supabaseClient'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const { error: authError } = isSignUp 
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`
            }
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          })

      if (authError) throw authError
      onClose()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#232a3b] rounded-2xl shadow-2xl p-8 max-w-md w-full border border-amber-900/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-amber-500">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button 
            onClick={onClose}
            className="text-amber-500/60 hover:text-amber-500"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1f2e] rounded-xl border border-amber-500/30 
                       text-white placeholder-amber-500/40 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-amber-500/30"></div>
          <span className="px-4 text-amber-500/60">or</span>
          <div className="flex-1 border-t border-amber-500/30"></div>
        </div>

        <button
          onClick={() => signInWithGoogle()}
          className="w-full px-4 py-2 bg-white text-gray-800 rounded-xl font-semibold
                   flex items-center justify-center gap-2 hover:bg-gray-100 transition duration-200"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Continue with Google
        </button>

        <p className="mt-4 text-center text-amber-500/60">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-amber-500 hover:text-amber-400"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
} 