import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/clients/supabaseClient'
import { SurveyData, ProjectPlan } from '@/lib/types/survey'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { userId, surveyData }: { userId: string; surveyData: SurveyData } = await request.json()

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a project planning assistant that outputs JSON in the following format:
          {
            "tasks": [
              {
                "id": "string",
                "title": "string",
                "description": "string",
                "startDate": "YYYY-MM-DD",
                "endDate": "YYYY-MM-DD",
                "dependencies": ["taskId"],
                "assignedTo": ["string"],
                "estimatedCost": number
              }
            ],
            "risks": [
              {
                "id": "string",
                "description": "string",
                "impact": "LOW" | "MEDIUM" | "HIGH",
                "probability": "LOW" | "MEDIUM" | "HIGH",
                "mitigation": "string",
                "contingency": "string"
              }
            ],
            "timeline": {
              "startDate": "YYYY-MM-DD",
              "endDate": "YYYY-MM-DD",
              "milestones": [
                {
                  "date": "YYYY-MM-DD",
                  "description": "string"
                }
              ]
            },
            "budget": {
              "total": number,
              "breakdown": {
                "category": number
              },
              "contingency": number
            }
          }`
        },
        {
          role: 'user',
          content: `Create a comprehensive project plan for a solo developer:
          
          Project Goals: ${surveyData.key_goals}
          Key Risks: ${surveyData.key_risks}
          Deadline: ${surveyData.deadline}
          Budget: ${surveyData.budget}

          Consider:
          1. How the goals affect task breakdown and timeline
          2. How risks might impact the budget and schedule
          3. Realistic timelines for a solo developer
          
          Provide a detailed breakdown in the specified JSON format.`
        }
      ],
      temperature: 0.7,
    })

    const projectPlan: ProjectPlan = JSON.parse(response.choices[0].message.content)

    // Store in Supabase
    const { error } = await supabase
      .from('project_plans')
      .upsert({
        user_id: userId,
        plan: projectPlan,
      }, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({ success: true, plan: projectPlan })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 