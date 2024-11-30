import { NextResponse } from 'next/server'
import { generatePitchDeckContent } from '@/lib/utils/generatePitchDeck'
import { PDFDocument, rgb } from 'pdf-lib'

export async function POST(request: Request) {
  try {
    const { projectPlan } = await request.json()
    if (!projectPlan) {
      return NextResponse.json(
        { error: 'Project plan is required' },
        { status: 400 }
      )
    }

    // Generate pitch deck content using OpenAI
    const pitchDeckContent = await generatePitchDeckContent(projectPlan)

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    
    const slides = [
      { title: 'Company Purpose', content: String(pitchDeckContent.companyPurpose || '') },
      { title: 'Problem', content: String(pitchDeckContent.problem || '') },
      { title: 'Solution', content: String(pitchDeckContent.solution || '') },
      { title: 'Why Now', content: String(pitchDeckContent.whyNow || '') },
      { title: 'Market Size', content: String(pitchDeckContent.marketSize || '') },
      { title: 'Competition', content: String(pitchDeckContent.competition || '') },
      { title: 'Product', content: String(pitchDeckContent.product || '') },
      { title: 'Business Model', content: String(pitchDeckContent.businessModel || '') },
      { title: 'Team', content: String(pitchDeckContent.team || '') },
      { title: 'Financials', content: String(pitchDeckContent.financials || '') }
    ]

    for (const slide of slides) {
      let page = pdfDoc.addPage([842, 595])
      const { width, height } = page.getSize()

      page.drawText(slide.title, {
        x: 50,
        y: height - 50,
        size: 24,
        color: rgb(0, 0, 0)
      })

      const contentLines = slide.content.split('\n')
      let y = height - 100
      
      contentLines.forEach(line => {
        if (y < 50) {
          page = pdfDoc.addPage([842, 595])
          y = height - 50
        }
        
        page.drawText(String(line).trim(), {
          x: 50,
          y,
          size: 14,
          color: rgb(0, 0, 0)
        })
        
        y -= 20
      })
    }

    const pdfBytes = await pdfDoc.save()
    const buffer = Buffer.from(pdfBytes)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="pitch-deck.pdf"',
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating pitch deck:', error)
    return NextResponse.json(
      { error: 'Failed to generate pitch deck' },
      { status: 500 }
    )
  }
} 