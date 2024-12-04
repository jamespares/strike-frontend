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
        asset_type: 'business_plan',
        title: 'Business Plan',
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

    // Generate business plan content using OpenAI
    const prompt = `Create a comprehensive business plan based on:
    Product: ${responses.product}
    Motivation/Problem: ${responses.motivation}
    Current Progress: ${responses.progress}
    Key Challenges: ${responses.challenges}
    Timeline: ${responses.deadline}
    Budget: $${responses.budget}
    
    The motivation/problem statement should be the foundation for the entire plan.
    Use it to shape:
    - Business objectives and goals
    - Target market selection
    - Value proposition
    - Strategic priorities
    - Success metrics
    
    Format the response as a JSON object with these sections:
    
    1. Executive Summary
       - Vision and mission derived from the motivation
       - Clear connection between problem and solution
       - High-level objectives and success criteria
    
    2. Strategic Analysis
       - Detailed problem/motivation analysis
       - Market size and opportunity
       - Competitive landscape
       - Unique value proposition
    
    3. Product Strategy
       - Product description and features
       - Development roadmap
       - Technical requirements
       - Innovation opportunities
    
    4. Market Strategy
       - Target customer segments
       - Go-to-market plan
       - Marketing channels
       - Pricing strategy based on value proposition
    
    5. Financial Projections
       - Revenue streams
       - Cost structure
       - Break-even analysis
       - Funding requirements
    
    6. Implementation Timeline
       - Key milestones
       - Resource allocation
       - Dependencies
       - Critical path
    
    7. Risk Analysis
       - Market risks
       - Technical risks
       - Financial risks
       - Mitigation strategies
    
    8. Key Performance Indicators (KPIs)
       Include specific metrics for each area:
       
       Business Health:
       - Monthly Recurring Revenue (MRR)
       - Customer Acquisition Cost (CAC)
       - Lifetime Value (LTV)
       - Burn Rate
       - Runway
    
       Product:
       - User Adoption Rate
       - Feature Usage
       - User Retention
       - System Uptime
       - Performance Metrics
    
       Customer Success:
       - Customer Satisfaction Score
       - Net Promoter Score
       - Support Response Time
       - Customer Churn Rate
       - Feature Request Implementation
    
       Marketing & Sales:
       - Conversion Rates
       - Lead Generation
       - Sales Cycle Length
       - Website Traffic
       - Social Media Engagement
    
    For each KPI, include:
    - Description
    - Target value
    - Measurement frequency
    - Tools for tracking
    - Action triggers (what to do if KPI is off target)
    
    Each section should have:
    - title: string
    - content: string[] (bullet points)
    - metrics: (optional) array of { label, value, unit }
    
    Make all projections and metrics realistic and achievable based on the budget and timeline.
    Focus on metrics that directly relate to the core motivation and problem being solved.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content generated from OpenAI')
    }

    const businessPlan = JSON.parse(content)

    // Create PDF document
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
      color: rgb(0, 0, 0)
    })

    // Add sections
    businessPlan.sections.forEach((section: BusinessPlanSection) => {
      page = pdfDoc.addPage([595, 842])
      let yPosition = height - 50

      // Section Title
      page.drawText(section.title, {
        x: 50,
        y: yPosition,
        size: 24,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })
      yPosition -= 40

      // Section Content
      const content = Array.isArray(section.content) ? section.content : [section.content]
      content.forEach((item: string) => {
        const lines = wrapText(item, 495)
        lines.forEach(line => {
          page.drawText(line, {
            x: 50,
            y: yPosition,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          })
          yPosition -= 20
        })
      })

      // Metrics (if any)
      if (section.metrics && section.metrics.length > 0) {
        yPosition -= 20
        page.drawText('Key Metrics:', {
          x: 50,
          y: yPosition,
          size: 14,
          font: timesRomanBoldFont,
          color: rgb(0, 0, 0)
        })
        yPosition -= 30

        section.metrics.forEach(metric => {
          const metricText = `${metric.label}: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}`
          page.drawText(metricText, {
            x: 50,
            y: yPosition,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          })
          yPosition -= 20
        })
      }
    })

    const pdfBytes = await pdfDoc.save()
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    // Update the asset record with both business plan and PDF
    const { error: updateError } = await supabase
      .from('user_assets')
      .update({
        content: {
          businessPlan,
          pdfBase64
        },
        status: 'completed'
      })
      .eq('id', asset.id)

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    return NextResponse.json({
      message: 'Business plan generated successfully',
      assetId: asset.id,
      businessPlan
    })
  } catch (error: any) {
    console.error('Error generating business plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate business plan' },
      { status: 500 }
    )
  }
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length <= maxWidth) {
      currentLine = testLine
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