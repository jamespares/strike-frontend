import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
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

    console.log('Creating PDF document...')
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

    // Load and embed the logo
    const logoPath = path.join(process.cwd(), 'public', 'logo-square.png')
    const logoBytes = await fs.readFile(logoPath)
    const logoImage = await pdfDoc.embedPng(logoBytes)
    const logoScale = 0.15 // Adjust this value to change logo size

    // Cover slide
    let page = pdfDoc.addPage([842, 595]) // Landscape A4
    const { width, height } = page.getSize()

    // Draw logo on cover
    const logoDims = logoImage.scale(logoScale)
    page.drawImage(logoImage, {
      x: 50,
      y: height - 100,
      width: logoDims.width,
      height: logoDims.height,
    })

    // Company name
    page.drawText(pitchDeckData.companyName, {
      x: 50 + logoDims.width + 20,
      y: height - 80,
      size: 48,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0)
    })

    // Tagline
    page.drawText(pitchDeckData.tagline, {
      x: 50 + logoDims.width + 20,
      y: height - 130,
      size: 24,
      font: timesRomanFont,
      color: rgb(0.4, 0.4, 0.4)
    })

    // Content slides
    pitchDeckData.slides.forEach(slide => {
      page = pdfDoc.addPage([842, 595]) // Landscape A4

      // Draw small logo in top-left corner
      const smallLogoScale = 0.08
      const smallLogoDims = logoImage.scale(smallLogoScale)
      page.drawImage(logoImage, {
        x: 50,
        y: height - 50,
        width: smallLogoDims.width,
        height: smallLogoDims.height,
      })

      // Slide title
      page.drawText(slide.title, {
        x: 50 + smallLogoDims.width + 20,
        y: height - 70,
        size: 36,
        font: timesRomanBoldFont,
        color: rgb(0, 0, 0)
      })

      let yPosition = height - 120

      switch (slide.type) {
        case 'bullets':
          slide.content.forEach(bullet => {
            page.drawText('•', {
              x: 50,
              y: yPosition,
              size: 18,
              font: timesRomanFont,
              color: rgb(0, 0, 0)
            })
            page.drawText(bullet, {
              x: 80,
              y: yPosition,
              size: 18,
              font: timesRomanFont,
              color: rgb(0, 0, 0)
            })
            yPosition -= 40
          })
          break

        case 'metrics':
          slide.content.forEach((metric, index) => {
            const xPosition = 50 + (index % 2) * 400
            const metricYPosition = yPosition - Math.floor(index / 2) * 100
            page.drawText(metric, {
              x: xPosition,
              y: metricYPosition,
              size: 24,
              font: timesRomanBoldFont,
              color: rgb(0, 0, 0)
            })
          })
          break

        case 'quote':
          page.drawText('"', {
            x: 50,
            y: yPosition + 20,
            size: 48,
            font: timesRomanBoldFont,
            color: rgb(0.8, 0.8, 0.8)
          })
          slide.content.forEach(line => {
            const lines = wrapText(line, 700) // Wider width for quotes
            lines.forEach(wrappedLine => {
              page.drawText(wrappedLine, {
                x: 90,
                y: yPosition,
                size: 24,
                font: timesRomanFont,
                color: rgb(0, 0, 0)
              })
              yPosition -= 40
            })
          })
          page.drawText('"', {
            x: width - 70,
            y: yPosition + 20,
            size: 48,
            font: timesRomanBoldFont,
            color: rgb(0.8, 0.8, 0.8)
          })
          break

        default: // text
          slide.content.forEach(paragraph => {
            const lines = wrapText(paragraph, 742) // Full width minus margins
            lines.forEach(line => {
              page.drawText(line, {
                x: 50,
                y: yPosition,
                size: 18,
                font: timesRomanFont,
                color: rgb(0, 0, 0)
              })
              yPosition -= 30
            })
            yPosition -= 20 // Extra space between paragraphs
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
        'Content-Disposition': 'attachment; filename="pitch-deck.pdf"'
      }
    })
  } catch (error: any) {
    console.error('Error generating pitch deck:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate pitch deck' },
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
    if (testLine.length * 7 <= maxWidth) { // Approximate character width
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

async function generatePitchDeckData(responses: SurveyResponse, questions: SurveyQuestion[]): Promise<PitchDeckData> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "system",
        content: "You are an expert pitch deck creator following Sequoia Capital's pitch deck principles. Create a compelling pitch deck based on the survey responses. Focus on clear value proposition, market opportunity, and business model."
      },
      {
        role: "user",
        content: `Create a pitch deck based on these survey responses:

Questions and Answers:
${questions.map(q => `
Q: ${q.question}
A: ${responses[q.fieldName as keyof SurveyResponse]}
Context: ${q.guidance.title}
- ${q.guidance.items.map(item => item.text).join('\n- ')}
`).join('\n')}

Generate a Sequoia Capital-style pitch deck with these slides:
1. Company Purpose (text)
2. Problem (bullets)
3. Solution (text)
4. Market Size (metrics)
5. Product (text)
6. Business Model (bullets)
7. Competition (bullets)
8. Traction & Metrics (metrics)
9. Team & Vision (text)
10. Fundraising (metrics)

Format the response as a JSON object with:
1. companyName: String with company name
2. tagline: String with company tagline
3. slides: Array of slide objects with {title, content[], type}

Keep the content compelling, data-driven, and focused on the investment opportunity.`
      }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}