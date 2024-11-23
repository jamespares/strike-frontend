'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useUser } from '../../../context/UserContext'
import { surveyQuestions } from '../../../data/surveyQuestions'
import { supabase } from '../../../lib/supabaseClient'

interface FormData {
  answer: string
}

export default function SurveyStep({ params }: { params: { step: string } }) {
  const router = useRouter()
  const { register, handleSubmit } = useForm<FormData>()
  const { session } = useUser()
  const [mounted, setMounted] = useState(false)
  const currentStep = parseInt(params.step)
  const question = surveyQuestions.find((q) => q.id === currentStep)

  useEffect(() => {
    setMounted(true)
    if (!session) {
      router.push('/')
    }
  }, [session, router])

  if (!mounted || !question) {
    return null
  }

  const onSubmit = async (data: FormData) => {
    const updates = {
      user_id: session?.user.id,
      [question.fieldName]: data.answer,
    }

    const { error } = await supabase
      .from('survey_responses')
      .upsert(updates, { onConflict: 'user_id' })

    if (error) {
      console.error('Error saving response:', error.message)
    } else {
      if (currentStep < surveyQuestions.length) {
        router.push(`/survey/${currentStep + 1}`)
      } else {
        router.push('/dashboard')
      }
    }
  }

  const handleBack = async () => {
    if (currentStep > 1) {
      router.push(`/survey/${currentStep - 1}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8 bg-gradient-to-b from-[#1a1f2e] to-[#2d1810]">
      <div className="max-w-3xl mx-auto bg-[#232a3b] rounded-2xl shadow-2xl p-10 border border-amber-900/30">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Question {currentStep} of {surveyQuestions.length}</h1>
          <div className="flex items-center gap-3 text-gray-400 mb-6">
            <span className="text-sm">Step {currentStep}/{surveyQuestions.length}</span>
            <div className="flex-1 h-1 bg-gray-700 rounded-full">
              <div 
                className="h-full bg-[#f5a524] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / surveyQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <label className="text-3xl font-bold block leading-relaxed text-[#f5a524]">
              {question.question}
            </label>
            <div className="space-y-4">
              <textarea
                {...register('answer', { required: true })}
                className="w-full px-6 py-4 bg-[#1a1f2e] rounded-xl
                           border-2 border-[#f5a524]/30 text-lg text-white
                           placeholder-[#f5a524]/40 min-h-[200px]
                           focus:outline-none focus:border-[#f5a524]
                           transition duration-300 ease-in-out"
                placeholder={question.placeholder}
                autoFocus
              />
              <div className="text-sm bg-[#1a1f2e] p-6 rounded-xl border border-[#f5a524]/30">
                <p className="font-medium mb-3 text-[#f5a524]">{question.guidance.title}</p>
                <ul className="space-y-2 text-white/90">
                  {question.guidance.items.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className="mr-2 text-[#f5a524]">{item.icon}</span> {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700
                         text-white rounded-xl text-lg font-semibold
                         hover:from-gray-700 hover:to-gray-800
                         transform hover:scale-105 active:scale-95
                         transition duration-200 ease-in-out
                         shadow-lg hover:shadow-xl
                         border border-gray-500/30"
              >
                Back to Previous
              </button>
            )}
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700
                       text-white rounded-xl text-lg font-semibold
                       hover:from-amber-700 hover:to-amber-800
                       transform hover:scale-105 active:scale-95
                       transition duration-200 ease-in-out
                       shadow-lg hover:shadow-xl
                       border border-amber-500/30"
            >
              {currentStep === surveyQuestions.length ? 'Complete' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
