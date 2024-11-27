'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@/context/UserContext'

export default function Home() {
  const router = useRouter()
  const { session, mounted } = useUser()

  useEffect(() => {
    if (mounted && !session) {
      router.push('/login')
    }
  }, [mounted, session, router])

  const handleBeginQuest = () => {
    if (session) {
      router.push('/survey/1')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8 bg-gradient-to-b from-[#1a1f2e] to-[#2d1810]">
      <div className="max-w-3xl mx-auto bg-[#232a3b] rounded-2xl shadow-2xl p-10 border border-amber-900/30">
        <h1 className="text-5xl font-bold mb-6 text-center text-amber-500 font-serif">
          Got a great idea? Not sure how to execute it?
        </h1>
        <p className="text-xl mb-8 leading-relaxed text-amber-100/90 text-center">
          You're in the right place.
          <br />
          <br />
          Answer our short survey and we'll build you a step-by-step plan, including task, and budget management tools, as well as a custom pitch deck to help you get funding. And for those wanting a bit of extra help, we offer ongoing 1-1 support to help you find the right tools and get your business up and running:
        </p>
        <ul className="mb-12 space-y-4 text-lg">
          <li className="flex items-center">
            <span className="mr-3 text-amber-500" aria-label="Road Map Icon">⚔️</span> 
            <span className="text-amber-100">A custom road map</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3 text-amber-500" aria-label="Spreadsheet Icon">📜</span> 
            <span className="text-amber-100">A timeline with all your tasks</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3 text-amber-500" aria-label="Budget Tracker Icon">💰</span> 
            <span className="text-amber-100">A budget tracker for profitability</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3 text-amber-500" aria-label="Risk Log Icon">🛡️</span> 
            <span className="text-amber-100">A risk log with strategies</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3 text-amber-500" aria-label="Pitch Deck Icon">📄</span> 
            <span className="text-amber-100">A custom pitch deck template</span>
          </li>
          <li className="flex items-center">
            <span className="mr-3 text-amber-500" aria-label="Pitch Deck Icon">💰</span> 
            <span className="text-amber-100">And 24/7 multi-lingual support to help you get your business up and running</span>
          </li>
        </ul>
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
    </div>
  )
}
