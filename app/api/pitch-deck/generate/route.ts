import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { google } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { supabase } from '@/lib/clients/supabaseClient'

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

async function generatePitchDeckData(
  responses: SurveyResponse,
  questions: SurveyQuestion[]
): Promise<PitchDeckData> {
  const prompt = `Create a pitch deck based on:
    Problem: ${responses.problem}
    Key Risks: ${responses.key_risks}
    Timeline: ${responses.deadline}
    Budget: $${responses.budget}
    Revenue Model: ${responses.pricing_model}
    
    Format the response as a pitch deck with:
    - Company name
    - Tagline
    - 8-10 slides covering: Problem, Solution, Market Size, Business Model, Competition, Go-to-Market, Team, Financials
    
    Each slide should have a title and 3-5 key bullet points.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('No content generated from OpenAI')
  }
  return JSON.parse(content) as PitchDeckData
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from Supabase using email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { responses, questions } = await request.json() as {
      responses: SurveyResponse
      questions: SurveyQuestion[]
    }

    if (!responses || !questions) {
      console.error('Missing survey responses or questions in request')
      return NextResponse.json(
        { error: 'Survey responses and questions are required' },
        { status: 400 }
      )
    }

    console.log('Generating pitch deck data...')
    const pitchDeckData = await generatePitchDeckData(responses, questions)
    
    if (!pitchDeckData || !pitchDeckData.slides.length) {
      console.error('Failed to generate pitch deck data')
      return NextResponse.json(
        { error: 'Failed to generate pitch deck data' },
        { status: 500 }
      )
    }

    // Initialize Google Slides API client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/presentations'],
    })

    const slides = google.slides({ version: 'v1', auth })

    // Create a new presentation
    const presentation = await slides.presentations.create({
      requestBody: {
        title: `${pitchDeckData.companyName} - Pitch Deck`,
      },
    })

    const presentationId = presentation.data.presentationId

    if (!presentationId) {
      throw new Error('Failed to create presentation')
    }

    // Create slides
    const requests = []

    // Title slide
    requests.push({
      createSlide: {
        objectId: 'titleSlide',
        insertionIndex: 0,
        slideLayoutReference: { predefinedLayout: 'TITLE' },
        placeholderIdMappings: [
          {
            layoutPlaceholder: { type: 'TITLE' },
            objectId: 'titleText',
          },
          {
            layoutPlaceholder: { type: 'SUBTITLE' },
            objectId: 'subtitleText',
          },
        ],
      },
    })

    requests.push(
      {
        insertText: {
          objectId: 'titleText',
          text: pitchDeckData.companyName,
        },
      },
      {
        insertText: {
          objectId: 'subtitleText',
          text: pitchDeckData.tagline,
        },
      }
    )

    // Content slides
    pitchDeckData.slides.forEach((slide, index) => {
      const slideId = `slide_${index}`
      const titleId = `title_${index}`
      const contentId = `content_${index}`

      requests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: index + 1,
          slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' },
          placeholderIdMappings: [
            {
              layoutPlaceholder: { type: 'TITLE' },
              objectId: titleId,
            },
            {
              layoutPlaceholder: { type: 'BODY' },
              objectId: contentId,
            },
          ],
        },
      })

      requests.push(
        {
          insertText: {
            objectId: titleId,
            text: slide.title,
          },
        },
        {
          insertText: {
            objectId: contentId,
            text: slide.content.map(point => `• ${point}`).join('\n'),
          },
        }
      )
    })

    // Apply the requests to create and populate slides
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: {
        requests,
      },
    })

    // Set sharing permissions (anyone with link can view)
    const drive = google.drive({ version: 'v3', auth })
    await drive.permissions.create({
      fileId: presentationId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`

    // Store in user_assets table
    const { data: asset, error: dbError } = await supabase
      .from('user_assets')
      .insert({
        user_id: userData.id,
        asset_type: 'pitch_deck',
        title: `${pitchDeckData.companyName} - Pitch Deck`,
        content: {
          googleSlidesUrl: presentationUrl,
          presentationId,
          slides: pitchDeckData.slides,
        },
        status: 'completed',
        last_updated: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    return NextResponse.json({
      googleSlidesUrl: presentationUrl,
      presentationId,
      assetId: asset.id,
      message: 'Pitch deck generated successfully',
    })
  } catch (error: any) {
    console.error('Error generating pitch deck:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate pitch deck' },
      { status: 500 }
    )
  }
}