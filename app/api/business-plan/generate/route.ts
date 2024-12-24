import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

interface SurveyResponse {
  id: string
  product: string
  motivation: string
  progress: string
  challenges: string
  deadline: string
  budget: string | number
}

interface BusinessPlanSection {
  title: string
  content: string | string[]
  metrics?: {
    label: string
    value: string | number
    unit?: string
  }[]
}

const MARKETING_CHANNELS = {
  social_media: {
    instagram: {
      strategy: 'Visual storytelling and behind-the-scenes content',
      best_practices: [
        'Use Instagram Stories for daily updates',
        'Share user testimonials',
        'Post process videos',
      ],
      example_accounts: ['@shopify', '@mailchimp', '@hubspot'],
    },
    linkedin: {
      strategy: 'Professional networking and thought leadership',
      best_practices: [
        'Share industry insights',
        'Post case studies',
        'Engage with industry leaders',
      ],
      example_accounts: ['@stripe', '@notion', '@figma'],
    },
  },
  content_marketing: {
    blog: {
      strategy: 'Educational content and SEO',
      topics: ['Industry trends', 'How-to guides', 'Case studies'],
      examples: ['Intercom blog', 'Buffer blog', 'Ahrefs blog'],
    },
    newsletter: {
      strategy: 'Direct engagement and lead nurturing',
      examples: ['The Hustle', 'Morning Brew', 'Indie Hackers'],
    },
  },
  partnerships: {
    types: ['Co-marketing', 'Integration partnerships', 'Affiliate programs'],
    example_companies: ['Stripe Atlas', 'AWS Startups', 'HubSpot for Startups'],
  },
}

async function generateBusinessPlan(responses: SurveyResponse) {
  const prompt = `Create a comprehensive business plan based on:
  Product: ${responses.product}
  Motivation/Problem: ${responses.motivation}
  Current Progress: ${responses.progress}
  Key Challenges: ${responses.challenges}
  Timeline: ${responses.deadline}
  Budget: $${responses.budget}

  Create a detailed business plan with the following sections:

  1. Mission Statement
  - A compelling mission statement that captures the essence of the business
  - Clear articulation of the problem being solved

  2. Product and Services
  - Detailed description of offerings
  - Key features and benefits
  - Unique selling propositions
  - Development roadmap

  3. Business Model
  - Revenue streams
  - Cost structure
  - Key partnerships
  - Value chain analysis
  - Scalability considerations

  4. Pricing Strategy
  - Detailed pricing structure
  - Competitive analysis
  - Value-based pricing justification
  - Pricing tiers if applicable

  5. Revenue Projections
  - Monthly projections for first year
  - Annual projections for years 2-5
  - Key assumptions explained
  - Break-even analysis

  6. Marketing Strategy
  - Target audience definition
  - Channel strategy using this data: ${JSON.stringify(MARKETING_CHANNELS)}
  - Content strategy
  - Growth tactics
  - Partnership opportunities
  - Specific campaign ideas

  7. Risk Analysis
  - Market risks
  - Technical risks
  - Financial risks
  - Detailed mitigation strategies

  8. Resource Requirements
  - Team structure
  - Technology needs
  - Infrastructure requirements
  - Third-party services

  9. Spending Plan
  - Detailed budget allocation
  - Marketing spend
  - Development costs
  - Operational expenses
  - Buffer considerations

  Format the response as a JSON object with each section having:
  - title: string
  - content: string[] (detailed bullet points)
  - metrics: array of { label, value, unit } where applicable

  Make all projections and metrics realistic and achievable based on the budget and timeline.
  Be specific and actionable in all recommendations.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content!)
}

async function qualityTestBusinessPlan(businessPlan: any) {
  const prompt = `Review and improve this business plan:
  ${JSON.stringify(businessPlan)}

  Evaluate and enhance the plan based on these criteria:
  1. Specificity - Are all recommendations and strategies specific and actionable?
  2. Realism - Are projections and timelines realistic?
  3. Completeness - Are all key aspects of the business covered?
  4. Consistency - Do all sections align with each other?
  5. Market Alignment - Does the plan reflect current market conditions?

  If you find any issues or areas for improvement, modify the content accordingly.
  Return the improved business plan in the same JSON format.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content!)
}

async function createPDF(businessPlan: any) {
  const pdfDoc = await PDFDocument.create()
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  // Load and embed the logo
  const logoPath = path.join(process.cwd(), 'public', 'logo-square.png')
  const logoBytes = await fs.readFile(logoPath)
  const logoImage = await pdfDoc.embedPng(logoBytes)
  const logoScale = 0.15

  // Title page
  let page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  // Draw logo
  const logoDims = logoImage.scale(logoScale)
  page.drawImage(logoImage, {
    x: 50,
    y: height - 100,
    width: logoDims.width,
    height: logoDims.height,
  })

  // Title
  page.drawText('Business Plan', {
    x: 50 + logoDims.width + 20,
    y: height - 80,
    size: 36,
    font: timesRomanBoldFont,
    color: rgb(0, 0, 0),
  })

  // Add sections
  Object.entries(businessPlan).forEach(([sectionKey, section]: [string, any]) => {
    if (sectionKey === 'metadata') return

    page = pdfDoc.addPage([595, 842])
    let yPosition = height - 50

    // Section Title
    page.drawText(section.title, {
      x: 50,
      y: yPosition,
      size: 24,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= 40

    // Section Content
    const content = Array.isArray(section.content) ? section.content : [section.content]
    content.forEach((item: string) => {
      const lines = wrapText(item, 70) // Wrap at 70 characters
      lines.forEach(line => {
        if (yPosition < 50) {
          page = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }

        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        })
        yPosition -= 20
      })
      yPosition -= 10 // Extra space between items
    })

    // Metrics if available
    if (section.metrics) {
      yPosition -= 20
      page.drawText('Key Metrics:', {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0),
      })
      yPosition -= 20

      section.metrics.forEach((metric: any) => {
        if (yPosition < 50) {
          page = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }

        const metricText = `${metric.label}: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}`
        page.drawText(metricText, {
          x: 50,
          y: yPosition,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        })
        yPosition -= 20
      })
    }
  })

  return await pdfDoc.save()
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

export async function POST(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { responses, questions, responseId } = await request.json()

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
        asset_type: 'business_plan',
        title: 'Business Plan',
        status: 'generating',
        content: null,
        survey_response_id: responseId,
      })
      .select()
      .single()

    if (assetError) {
      console.error('Error creating asset record:', assetError)
      return NextResponse.json({ error: 'Failed to initialize asset generation' }, { status: 500 })
    }

    // Generate initial business plan
    console.log('Generating initial business plan...')
    const initialPlan = await generateBusinessPlan(responses)

    // Quality test and improve the plan
    console.log('Quality testing business plan...')
    const finalPlan = await qualityTestBusinessPlan(initialPlan)

    // Generate PDF
    console.log('Creating PDF...')
    const pdfBytes = await createPDF(finalPlan)

    // Store the PDF in Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('business-plans')
      .upload(`${session.user.id}/${asset.id}.pdf`, pdfBytes)

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
      throw uploadError
    }

    // Update asset record
    const { error: updateError } = await supabase
      .from('user_assets')
      .update({
        status: 'completed',
        content: finalPlan,
        file_path: `${session.user.id}/${asset.id}.pdf`,
      })
      .eq('id', asset.id)

    if (updateError) {
      console.error('Error updating asset record:', updateError)
      throw updateError
    }

    return NextResponse.json({ success: true, assetId: asset.id })
  } catch (error) {
    console.error('Error generating business plan:', error)
    return NextResponse.json({ error: 'Failed to generate business plan' }, { status: 500 })
  }
}
