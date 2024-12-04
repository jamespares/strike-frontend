import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

interface SurveyResponse {
  problem: string
  key_risks: string
  deadline: string
  budget: string | number
  pricing_model: string
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
    const prompt = `Create a detailed business plan based on:
    Problem: ${responses.problem}
    Key Risks: ${responses.key_risks}
    Timeline: ${responses.deadline}
    Budget: $${responses.budget}
    Revenue Model: ${responses.pricing_model}
    
    First, critically evaluate the proposed pricing model:
    1. Compare it with market averages and competitor pricing in the industry
    2. Assess whether it aligns with the target market's willingness to pay
    3. Evaluate if it can sustain the business and generate sufficient margins
    4. Consider if it matches the value proposition and service quality
    
    If the proposed pricing model is unrealistic or suboptimal:
    1. Suggest a more realistic pricing strategy based on market research
    2. Explain why the alternative is more suitable
    3. Provide specific examples from similar successful businesses
    4. Show the impact on revenue projections and business viability
    
    Format the response as a JSON object with sections array containing:
    - Executive Summary
    - Problem Statement
    - Solution Overview
    - Market Analysis
    - Business Model (include a subsection specifically analyzing the pricing strategy with:
      * Evaluation of proposed pricing model
      * Comparison with market standards
      * Alternative pricing recommendations if needed
      * Justification for final pricing strategy)
    - Financial Projections (include detailed metrics for:
      * Year 1-3 Revenue Projections (based on the recommended pricing strategy)
      * Customer Growth Estimates
      * Cost Structure Breakdown
      * Key Financial Metrics (CAC, LTV, Break-even Point)
      * Monthly Burn Rate
      * Funding Requirements
      Make sure to include realistic numbers and growth trajectories based on market research and industry standards)
    - Risk Analysis
    - Implementation Timeline
    
    Each section should have:
    - title: string
    - content: string[] (bullet points)
    - metrics: (optional) array of { label, value, unit }
    
    For the Business Model section, ensure the metrics array includes:
    - Market Average Price
    - Competitor Price Range
    - Recommended Price Point
    - Expected Profit Margin
    
    For the Financial Projections section, ensure the metrics array includes:
    - Year 1 Revenue Target
    - Year 2 Revenue Target
    - Year 3 Revenue Target
    - Initial Customer Base
    - Customer Growth Rate
    - Average Revenue Per User
    - Customer Acquisition Cost
    - Customer Lifetime Value
    - Monthly Operating Costs
    - Break-even Timeline
    
    Make all financial projections realistic and well-justified based on the market size, competition, and industry standards.
    Include clear explanations in the content array for how these numbers were derived.
    If suggesting an alternative pricing model, clearly explain the rationale and expected impact on the business metrics.`

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