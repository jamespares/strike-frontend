import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
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

    console.log('Generating idea evaluation...')
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

    // Overall Score
    page.drawText(`Overall Score: ${evaluation.overallScore}/100`, {
      x: 50,
      y: height - 200,
      size: 24,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0)
    })

    // Recommendation
    const recommendationLines = wrapText(evaluation.recommendation, 495)
    let yPosition = height - 250
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
      page.drawText(`Score: ${category.data.score}/100`, {
        x: 50,
        y: yPosition - 40,
        size: 18,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })

      // Analysis
      yPosition -= 80
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

      // Positives
      yPosition -= 20
      page.drawText(category.positiveLabel + ':', {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })
      yPosition -= 30

      category.data.positives.forEach((item: string) => {
        page.drawText('•', {
          x: 50,
          y: yPosition,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        })
        page.drawText(item, {
          x: 70,
          y: yPosition,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        })
        yPosition -= 20
      })

      // Negatives
      yPosition -= 20
      page.drawText(category.negativeLabel + ':', {
        x: 50,
        y: yPosition,
        size: 14,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })
      yPosition -= 30

      category.data.negatives.forEach((item: string) => {
        page.drawText('•', {
          x: 50,
          y: yPosition,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        })
        page.drawText(item, {
          x: 70,
          y: yPosition,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        })
        yPosition -= 20
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
    
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="idea-evaluation.pdf"'
      }
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
        Evaluate business ideas based on:
        1. Problem (pain point clarity, urgency, market need)
        2. Market (size, growth, competition, barriers)
        3. Solution (uniqueness, feasibility, competitive advantage)
        4. Execution Feasibility (technical, timeline, budget)
        5. Business Model (revenue potential, scalability, unit economics)

        Provide concise, actionable feedback in JSON format.`
      },
      {
        role: "user",
        content: `Evaluate this startup idea:
        Problem: ${responses.problem}
        Key Risks: ${responses.key_risks}
        Timeline: ${responses.deadline}
        Budget: $${budget}
        Revenue Model: ${responses.pricing_model}`
      }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')
  console.log('Evaluation generated successfully')
  return result
} 