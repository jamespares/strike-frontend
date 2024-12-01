import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { openai } from '@/lib/clients/openaiClient'
import { SurveyQuestion } from '@/data/surveyQuestions'
import fs from 'fs/promises'
import path from 'path'

interface SurveyResponse {
  problem: string
  solution: string
  key_risks: string
  deadline: string
  budget: number
  pricing_model: string
}

interface BusinessPlanContent {
  [key: string]: string
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

    console.log('Generating business plan content...')
    const businessPlanContent = await generateBusinessPlanContent(responses, questions)
    
    if (!businessPlanContent || Object.keys(businessPlanContent).length === 0) {
      console.error('Failed to generate business plan content')
      return NextResponse.json(
        { error: 'Failed to generate business plan content' },
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
    const logoScale = 0.15 // Adjust this value to change logo size

    // Add title page
    let page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()

    // Draw logo on cover
    const logoDims = logoImage.scale(logoScale)
    page.drawImage(logoImage, {
      x: 50,
      y: height - 100,
      width: logoDims.width,
      height: logoDims.height,
    })

    // Title with green underline
    page.drawText('Business Plan', {
      x: 50 + logoDims.width + 20,
      y: height - 80,
      size: 36,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0)
    })

    // Company name in footer
    page.drawText('launchbooster.io', {
      x: width - 150,
      y: 30,
      size: 12,
      font: timesRomanFont,
      color: rgb(0.6, 0.6, 0.6)
    })

    // Add content pages
    Object.entries(businessPlanContent).forEach(([section, content]) => {
      page = pdfDoc.addPage([595, 842])
      
      // Draw small logo in top-left corner
      const smallLogoScale = 0.08
      const smallLogoDims = logoImage.scale(smallLogoScale)
      page.drawImage(logoImage, {
        x: 50,
        y: height - 50,
        width: smallLogoDims.width,
        height: smallLogoDims.height,
      })

      // Section title
      page.drawText(section, {
        x: 50 + smallLogoDims.width + 20,
        y: height - 50,
        size: 24,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })

      // Section content with word wrap
      const words = content.split(' ')
      let line = ''
      let yPosition = height - 100
      
      words.forEach((word: string) => {
        const testLine = line + word + ' '
        const textWidth = timesRomanFont.widthOfTextAtSize(testLine, 12)
        
        if (textWidth > 495) { // Page width minus margins
          page.drawText(line, {
            x: 50,
            y: yPosition,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          })
          line = word + ' '
          yPosition -= 20
          
          // Add new page if needed
          if (yPosition < 50) {
            page = pdfDoc.addPage([595, 842])
            
            // Add logo and footer to new page
            page.drawImage(logoImage, {
              x: 50,
              y: height - 50,
              width: smallLogoDims.width,
              height: smallLogoDims.height,
            })
            
            page.drawText('launchbooster.io', {
              x: width - 150,
              y: 30,
              size: 12,
              font: timesRomanFont,
              color: rgb(0.6, 0.6, 0.6)
            })
            
            yPosition = height - 50
          }
        } else {
          line = testLine
        }
      })
      
      // Draw remaining text
      if (line.trim().length > 0) {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 12,
          font: timesRomanFont,
          color: rgb(0, 0, 0)
        })
      }

      // Add footer with company name
      page.drawText('launchbooster.io', {
        x: width - 150,
        y: 30,
        size: 12,
        font: timesRomanFont,
        color: rgb(0.6, 0.6, 0.6)
      })
    })

    const pdfBytes = await pdfDoc.save()
    
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="business-plan.pdf"'
      }
    })
  } catch (error: any) {
    console.error('Error generating business plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate business plan' },
      { status: 500 }
    )
  }
}

async function generateBusinessPlanContent(responses: SurveyResponse, questions: SurveyQuestion[]): Promise<BusinessPlanContent> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "system",
        content: "You are an expert business plan writer. Create a professional business plan based on the survey responses provided. Focus on clarity, actionable insights, and realistic projections."
      },
      {
        role: "user",
        content: `Create a detailed business plan based on these survey responses:

Questions and Answers:
${questions.map(q => `
Q: ${q.question}
A: ${responses[q.fieldName as keyof SurveyResponse]}
Context: ${q.guidance.title}
- ${q.guidance.items.map(item => item.text).join('\n- ')}
`).join('\n')}

Generate a comprehensive business plan with the following sections:
1. Executive Summary
2. Problem Statement
3. Solution Overview
4. Market Analysis
5. Business Model
6. Financial Projections
7. Risk Analysis
8. Implementation Timeline

Format the response as a JSON object with these section names as keys and detailed content as values.
Keep the content professional, actionable, and grounded in the survey responses.`
      }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
} 