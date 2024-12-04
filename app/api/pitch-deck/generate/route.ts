import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SurveyQuestion } from '@/data/surveyQuestions'

interface SurveyResponse {
  problem: string
  key_risks: string
  deadline: string
  budget: string | number
  pricing_model: string
}

interface PitchSlide {
  title: string
  content: string[]
  type: 'text' | 'bullets' | 'metrics' | 'quote'
}

interface PitchDeckData {
  companyName: string
  tagline: string
  slides: PitchSlide[]
}

export async function POST(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { responses, questions } = await request.json() as {
      responses: SurveyResponse
      questions: SurveyQuestion[]
    }

    if (!responses || !questions) {
      return NextResponse.json(
        { error: 'Survey responses and questions are required' },
        { status: 400 }
      )
    }

    // Create initial asset record
    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .insert({
        user_id: session.user.id,
        asset_type: 'pitch_deck',
        title: 'Pitch Deck',
        status: 'generating',
        content: null
      })
      .select()
      .single()

    if (assetError) {
      console.error('Error creating asset record:', assetError)
      return NextResponse.json(
        { error: 'Failed to initialize asset generation' },
        { status: 500 }
      )
    }

    // Generate pitch deck content
    const prompt = `Create a pitch deck based on:
    Problem: ${responses.problem}
    Key Risks: ${responses.key_risks}
    Timeline: ${responses.deadline}
    Budget: $${responses.budget}
    Revenue Model: ${responses.pricing_model}
    
    Format the response as a JSON object with:
    - companyName: string
    - tagline: string
    - slides: Array of {
        title: string
        content: string[]
        type: 'text' | 'bullets' | 'metrics' | 'quote'
      }
    
    Include 10-12 slides covering:
    - Problem & Solution
    - Market Size & Opportunity
    - Business Model
    - Competition & Advantages
    - Go-to-Market Strategy
    - Financial Projections
    - Team & Vision
    - Ask & Use of Funds`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content generated from OpenAI')
    }

    const pitchDeckData = JSON.parse(content) as PitchDeckData

    // Initialize Google Slides API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || ''),
      scopes: ['https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/drive']
    })

    const slides = google.slides({ version: 'v1', auth })
    const drive = google.drive({ version: 'v3', auth })

    // Create new presentation
    const presentation = await slides.presentations.create({
      requestBody: {
        title: `${pitchDeckData.companyName} - Pitch Deck`
      }
    })

    const presentationId = presentation.data.presentationId

    if (!presentationId) {
      throw new Error('Failed to create Google Slides presentation')
    }

    // Create slides content (implementation details omitted for brevity)
    // ... slides creation logic ...

    // Set sharing permissions
    await drive.permissions.create({
      fileId: presentationId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    })

    const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`

    // Update the asset record with the generated content
    const { error: updateError } = await supabase
      .from('user_assets')
      .update({
        content: {
          googleSlidesUrl: presentationUrl,
          presentationId,
          companyName: pitchDeckData.companyName,
          tagline: pitchDeckData.tagline,
          slides: pitchDeckData.slides
        },
        status: 'completed'
      })
      .eq('id', asset.id)

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    return NextResponse.json({
      message: 'Pitch deck generated successfully',
      assetId: asset.id,
      googleSlidesUrl: presentationUrl,
      presentationId,
      ...pitchDeckData
    })
  } catch (error: any) {
    console.error('Error generating pitch deck:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate pitch deck' },
      { status: 500 }
    )
  }
}