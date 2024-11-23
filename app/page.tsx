'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../context/UserContext'
import AuthModal from '../components/AuthModal'

export default function Home() {
  const router = useRouter()
  const { session, mounted } = useUser()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] text-white p-8">
        <div className="max-w-3xl mx-auto bg-[#232a3b] rounded-2xl shadow-2xl p-10">
          <p className="text-xl">The journey begins...</p>
        </div>
      </div>
    )
  }

  const handleBeginQuest = () => {
    if (session) {
      router.push('/survey/1')
    } else {
      setShowAuthModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8 bg-gradient-to-b from-[#1a1f2e] to-[#2d1810]">
      <div className="max-w-3xl mx-auto bg-[#232a3b] rounded-2xl shadow-2xl p-10 border border-amber-900/30">
        <h1 className="text-5xl font-bold mb-6 text-center text-amber-500 font-serif">
          The Project Planner for Indie Hackers
        </h1>
        <p className="text-xl mb-8 leading-relaxed text-amber-100/90 text-center">
          Turn your idea into a concrete plan. 
          <br />
          <br />
          All you need to do is answer four questions and we'll generate:
        </p>
        <ul className="mb-12 space-y-4 text-lg">
          <li className="flex items-center">
            <span className="mr-3 text-amber-500">⚔️</span> 
            <span className="text-amber-100">A custom road map</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3 text-amber-500">📜</span> 
            <span className="text-amber-100">A spreadsheet with all your tasks and a clear timeline to get them done</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3 text-amber-500">💰</span> 
            <span className="text-amber-100">A budget tracker to manage your costs and ensure you're profitable</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3 text-amber-500">🛡️</span> 
            <span className="text-amber-100">A risk log with clear strategies to tackle challenges</span>
          </li>
        </ul>
        <p className="text-lg mb-8 text-amber-100/90 text-center">
          All fully downloadable and customisable.
          <br />
        </p>
        <div className="text-center">
          <button 
            onClick={handleBeginQuest}
            className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700
                      text-white rounded-xl text-lg font-semibold
                      hover:from-amber-700 hover:to-amber-800
                      transform hover:scale-105 active:scale-95
                      transition duration-200 ease-in-out
                      shadow-lg hover:shadow-xl
                      border border-amber-500/30"
          >
            Begin Your Quest
          </button>
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
