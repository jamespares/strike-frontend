'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useUser } from '@/context/UserContext'
import { surveyQuestions } from '@/data/surveyQuestions'
import { supabase } from '@/lib/clients/supabaseClient'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { loadStripe } from '@stripe/stripe-js';

interface FormData {
  answer: string
}

// Define validation schema based on current step
const validationSchema = yup.object().shape({
  answer: yup.string().required('This field is required').max(1000, 'Maximum length exceeded'),
})

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SurveyStep({ params }: { params: { step: string } }) {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
  })
  const { session } = useUser()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    try {
      setIsSubmitting(true)
      if (!session?.user?.id) {
        console.error('No user ID found')
        alert('Session error: Please try logging in again')
        return
      }

      console.log('Starting survey submission...', {
        userId: session.user.id,
        step: currentStep,
        fieldName: question.fieldName,
        answer: data.answer
      })

      // If this is the first question (step 1), create a new response
      if (currentStep === 1) {
        console.log('Step 1: Creating new survey response...')
        
        try {
          // First, set all existing responses for this user to not latest
          console.log('Setting previous responses to not latest...')
          const { error: updateError } = await supabase
            .from('survey_responses')
            .update({ is_latest: false })
            .eq('user_id', session.user.id)

          if (updateError) {
            console.error('Error updating existing responses:', updateError)
            throw updateError
          }
          console.log('Previous responses updated successfully')

          // Then create a new response
          console.log('Creating new response...')
          const { data: newResponse, error: insertError } = await supabase
            .from('survey_responses')
            .insert({
              user_id: session.user.id,
              [question.fieldName]: data.answer,
              is_latest: true
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error creating new response:', insertError)
            throw insertError
          }
          console.log('New response created successfully:', newResponse)

        } catch (error) {
          console.error('Database operation failed:', error)
          alert('Failed to save your response. Please try again.')
          return
        }
      } else {
        // For subsequent questions, update the latest response
        console.log(`Step ${currentStep}: Updating existing response...`)
        
        try {
          const { data: updatedResponse, error: updateError } = await supabase
            .from('survey_responses')
            .update({
              [question.fieldName]: data.answer,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', session.user.id)
            .eq('is_latest', true)
            .select()
            .single()

          if (updateError) {
            console.error('Error updating response:', updateError)
            throw updateError
          }
          console.log('Response updated successfully:', updatedResponse)

        } catch (error) {
          console.error('Database operation failed:', error)
          alert('Failed to save your response. Please try again.')
          return
        }
      }

      console.log('Survey response saved successfully')

      // If this is the last question, redirect to payment
      if (currentStep === surveyQuestions.length) {
        router.push('/payment')
      } else {
        router.push(`/survey/${currentStep + 1}`)
      }
    } catch (err) {
      console.error('Error in form submission:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = async () => {
    if (currentStep > 1) {
      router.push(`/survey/${currentStep - 1}`)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-white text-gray-700 rounded-lg text-sm font-medium
                      hover:bg-gray-50 transform hover:scale-105 active:scale-95
                      transition duration-200 ease-in-out
                      border border-gray-200 flex items-center gap-2 shadow-sm"
          >
            <span>←</span> Home
          </button>
          <span className="text-gray-600 font-medium relative">
            Question {currentStep} of {surveyQuestions.length}
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 text-gray-500">
            <span className="text-sm font-medium">Progress</span>
            <div className="flex-1 h-1 bg-gray-100 rounded-full">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / surveyQuestions.length) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">{Math.round((currentStep / surveyQuestions.length) * 100)}%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <label className="text-3xl font-bold block leading-relaxed text-gray-900">
                {question.question}
              </label>
              <div className="space-y-4">
                <textarea
                  {...register('answer')}
                  className="w-full px-6 py-4 bg-gray-50 rounded-xl
                           border-2 border-gray-200 text-gray-900
                           placeholder-gray-400 min-h-[200px]
                           focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                           transition duration-200 ease-in-out"
                  placeholder={question.placeholder}
                  autoFocus
                />
                {errors.answer && (
                  <p className="text-red-500 text-sm">{errors.answer.message}</p>
                )}
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <p className="font-medium mb-3 text-gray-900 relative inline-block">
                    {question.guidance.title}
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    {question.guidance.items.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="text-emerald-500">{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6">
              <div className="space-x-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2.5 bg-white text-gray-700 rounded-lg text-sm font-medium
                             hover:bg-gray-50 transform hover:scale-105 active:scale-95
                             transition duration-200 ease-in-out shadow-sm
                             border border-gray-200 flex items-center gap-2"
                  >
                    <span>←</span> Previous
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium
                         hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                         transition duration-200 ease-in-out shadow-sm
                         flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    {currentStep === surveyQuestions.length ? 'Complete' : 'Continue'} <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
