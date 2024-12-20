import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface SurveyResponse {
  id: string
  product: string
  motivation: string
  progress: string
  challenges: string
  deadline: string
  budget: string | number
}

interface CategoryData {
  score: number
  analysis: string
  positives: string[]
  negatives: string[]
}

interface IdeaEvaluation {
  problemScore: CategoryData
  marketScore: CategoryData
  solutionScore: CategoryData
  feasibilityScore: CategoryData
  businessModelScore: CategoryData
  overallScore: number
  recommendation: string
  nextSteps: string[]
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
      console.error('Missing survey responses or questions in request')
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
        asset_type: 'idea_evaluation',
        title: 'Idea Evaluation',
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

    console.log('Generating idea evaluation...')
    console.log('Starting evaluation generation with responses:', responses)
    const evaluation = await generateIdeaEvaluation(responses, questions)
    
    if (!evaluation) {
      console.error('Failed to generate idea evaluation')
      return NextResponse.json(
        { error: 'Failed to generate idea evaluation' },
        { status: 500 }
      )
    }

    console.log('Creating PDF document...')
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
    page.drawText('Idea Evaluation Report', {
      x: 50 + logoDims.width + 20,
      y: height - 80,
      size: 36,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0)
    })

    // Disclaimer
    const disclaimer = "Although we will evaluate this idea, it is ultimately you that decides whether it is a good idea. If you disagree with anything stated in this report and have conviction in your idea then go ahead - don't let us stop you. Treat this as just a source of friendly challenge to help you to sharpen your vision and deliver results. Please see the following assets for recommendations on how to deliver your goals successfully."
    const disclaimerLines = wrapText(disclaimer, 495)
    let disclaimerY = height - 150
    disclaimerLines.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: disclaimerY,
        size: 12,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      })
      disclaimerY -= 20
    })

    // Overall Score (adjusted Y position to account for disclaimer)
    page.drawText(`Overall Score: ${evaluation.overallScore}/100`, {
      x: 50,
      y: disclaimerY - 30,
      size: 24,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0)
    })

    // Recommendation (adjusted Y position)
    const recommendationLines = wrapText(evaluation.recommendation, 495)
    let yPosition = disclaimerY - 80
    recommendationLines.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanFont,
        color: rgb(0, 0, 0)
      })
      yPosition -= 20
    })

    // Score Categories
    const categories = [
      { 
        title: 'Problem Analysis', 
        data: evaluation.problemScore,
        positiveLabel: 'Strengths',
        negativeLabel: 'Weaknesses'
      },
      { 
        title: 'Market Analysis', 
        data: evaluation.marketScore,
        positiveLabel: 'Opportunities',
        negativeLabel: 'Threats'
      },
      { 
        title: 'Solution Analysis', 
        data: evaluation.solutionScore,
        positiveLabel: 'Strengths',
        negativeLabel: 'Weaknesses'
      },
      { 
        title: 'Feasibility Analysis', 
        data: evaluation.feasibilityScore,
        positiveLabel: 'Advantages',
        negativeLabel: 'Challenges'
      },
      { 
        title: 'Business Model Analysis', 
        data: evaluation.businessModelScore,
        positiveLabel: 'Strengths',
        negativeLabel: 'Risks'
      }
    ]

    categories.forEach(category => {
      page = pdfDoc.addPage([595, 842])
      yPosition = height - 50

      // Category Title
      page.drawText(category.title, {
        x: 50,
        y: yPosition,
        size: 24,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })

      // Score
      yPosition -= 40
      page.drawText(`Score: ${category.data.score}/100`, {
        x: 50,
        y: yPosition,
        size: 18,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })

      // Analysis heading
      yPosition -= 40
      page.drawText('Analysis:', {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })

      // Analysis content
      yPosition -= 25
      const analysisLines = wrapText(category.data.analysis, 495)
      analysisLines.forEach(line => {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        })
        yPosition -= 20
      })

      // Positives heading
      yPosition -= 30
      page.drawText(category.positiveLabel + ':', {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })

      // Positives content
      yPosition -= 25
      category.data.positives.forEach((item: string) => {
        const itemLines = wrapText(item, 475)  // Slightly narrower to account for bullet indent
        itemLines.forEach((line, index) => {
          if (index === 0) {
            page.drawText('•', {
              x: 50,
              y: yPosition,
              size: 12,
              font: timesRomanFont,
              color: rgb(0, 0, 0)
            })
          }
          page.drawText(line, {
            x: 70,  // Consistent indent for wrapped lines
            y: yPosition,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          })
          yPosition -= 20
        })
      })

      // Negatives heading
      yPosition -= 30
      page.drawText(category.negativeLabel + ':', {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })

      // Negatives content
      yPosition -= 25
      category.data.negatives.forEach((item: string) => {
        const itemLines = wrapText(item, 475)  // Slightly narrower to account for bullet indent
        itemLines.forEach((line, index) => {
          if (index === 0) {
            page.drawText('•', {
              x: 50,
              y: yPosition,
              size: 12,
              font: timesRomanFont,
              color: rgb(0, 0, 0)
            })
          }
          page.drawText(line, {
            x: 70,  // Consistent indent for wrapped lines
            y: yPosition,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          })
          yPosition -= 20
        })
      })
    })

    // Next Steps page
    page = pdfDoc.addPage([595, 842])
    yPosition = height - 50

    page.drawText('Recommended Next Steps', {
      x: 50,
      y: yPosition,
      size: 24,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0)
    })

    yPosition -= 50
    evaluation.nextSteps.forEach((step, index) => {
      page.drawText(`${index + 1}.`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })

      const stepLines = wrapText(step, 475)
      stepLines.forEach(line => {
        page.drawText(line, {
          x: 70,
          y: yPosition,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        })
        yPosition -= 20
      })
      yPosition -= 10
    })

    const pdfBytes = await pdfDoc.save()
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    // Update the asset record with both evaluation and PDF
    const { error: updateError } = await supabase
      .from('user_assets')
      .update({
        content: {
          evaluation: JSON.parse(JSON.stringify(evaluation)), // Ensure evaluation is serializable
          pdfBase64
        },
        status: 'completed'
      })
      .eq('id', asset.id)

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    return NextResponse.json({
      message: 'Idea evaluation generated successfully',
      assetId: asset.id,
      evaluation: JSON.parse(JSON.stringify(evaluation)) // Ensure evaluation is serializable
    })
  } catch (error: any) {
    console.error('Error generating idea evaluation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate idea evaluation' },
      { status: 500 }
    )
  }
}

function wrapText(text: string | undefined | null, maxWidth: number): string[] {
  if (!text) return [''];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function generateIdeaEvaluation(responses: SurveyResponse, questions: SurveyQuestion[]): Promise<IdeaEvaluation> {
  console.log('Starting evaluation generation with responses:', responses)
  
  // Convert budget to number if it's a string
  const budget = typeof responses.budget === 'string' ? parseFloat(responses.budget.replace(/[^0-9.-]+/g, '')) : responses.budget

  const completion = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "system",
        content: `You are an expert startup idea evaluator with experience from Y Combinator and top VCs.
        Evaluate business ideas and return a JSON object with this exact structure:
        {
          "problemScore": {
            "score": number (0-100),
            "analysis": string,
            "positives": string[],
            "negatives": string[]
          },
          "marketScore": {
            "score": number (0-100),
            "analysis": string,
            "positives": string[],
            "negatives": string[]
          },
          "solutionScore": {
            "score": number (0-100),
            "analysis": string,
            "positives": string[],
            "negatives": string[]
          },
          "feasibilityScore": {
            "score": number (0-100),
            "analysis": string,
            "positives": string[],
            "negatives": string[]
          },
          "businessModelScore": {
            "score": number (0-100),
            "analysis": string,
            "positives": string[],
            "negatives": string[]
          },
          "overallScore": number (0-100),
          "recommendation": string,
          "nextSteps": string[]
        }`
      },
      {
        role: "user",
        content: `Evaluate this startup idea:
        Product: ${responses.product}
        Motivation/Problem: ${responses.motivation}
        Current Progress: ${responses.progress}
        Key Challenges: ${responses.challenges}
        Timeline: ${responses.deadline}
        Budget: $${budget}
        
        Provide a thorough evaluation following the exact JSON structure specified.
        Ensure all scores are numbers between 0-100.
        Include 3-5 points in each positives/negatives array.
        Provide 3-5 concrete next steps.`
      }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')
  console.log('Evaluation generated successfully')
  return result
} 