import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/clients/supabaseServer'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

async function generatePitchDeck(projectPlan: any) {
  const pdfDoc = await PDFDocument.create()
  
  // Title Slide
  const titlePage = pdfDoc.addPage()
  const { width, height } = titlePage.getSize()
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const subtitleFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  const title = projectPlan.businessName || 'Business Pitch Deck'
  const titleWidth = titleFont.widthOfTextAtSize(title, 36)
  
  titlePage.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 150,
    size: 36,
    font: titleFont,
    color: rgb(0, 0, 0),
  })

  const subtitle = projectPlan.tagline || 'Your Vision, Our Solution'
  const subtitleWidth = subtitleFont.widthOfTextAtSize(subtitle, 18)
  
  titlePage.drawText(subtitle, {
    x: (width - subtitleWidth) / 2,
    y: height - 200,
    size: 18,
    font: subtitleFont,
    color: rgb(0.4, 0.4, 0.4),
  })

  // Problem & Solution Slide
  const problemPage = pdfDoc.addPage()
  const sectionFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const contentFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  problemPage.drawText('Problem', {
    x: 50,
    y: height - 50,
    size: 24,
    font: sectionFont,
    color: rgb(0, 0, 0),
  })

  if (projectPlan.problem) {
    problemPage.drawText(projectPlan.problem, {
      x: 50,
      y: height - 100,
      size: 14,
      font: contentFont,
      color: rgb(0, 0, 0),
    })
  }

  problemPage.drawText('Solution', {
    x: 50,
    y: height - 200,
    size: 24,
    font: sectionFont,
    color: rgb(0, 0, 0),
  })

  if (projectPlan.solution) {
    problemPage.drawText(projectPlan.solution, {
      x: 50,
      y: height - 250,
      size: 14,
      font: contentFont,
      color: rgb(0, 0, 0),
    })
  }

  // Market & Business Model Slide
  const marketPage = pdfDoc.addPage()
  
  marketPage.drawText('Market Opportunity', {
    x: 50,
    y: height - 50,
    size: 24,
    font: sectionFont,
    color: rgb(0, 0, 0),
  })

  if (projectPlan.marketOpportunity) {
    marketPage.drawText(projectPlan.marketOpportunity, {
      x: 50,
      y: height - 100,
      size: 14,
      font: contentFont,
      color: rgb(0, 0, 0),
    })
  }

  marketPage.drawText('Business Model', {
    x: 50,
    y: height - 200,
    size: 24,
    font: sectionFont,
    color: rgb(0, 0, 0),
  })

  if (projectPlan.businessModel) {
    marketPage.drawText(projectPlan.businessModel, {
      x: 50,
      y: height - 250,
      size: 14,
      font: contentFont,
      color: rgb(0, 0, 0),
    })
  }

  return pdfDoc
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const projectPlan = body.projectPlan

    if (!projectPlan) {
      return NextResponse.json({ 
        error: 'Project plan data is required in request body' 
      }, { status: 400 })
    }

    console.log('Generating pitch deck with project plan:', projectPlan)
    const pdfDoc = await generatePitchDeck(projectPlan)
    const pdfBytes = await pdfDoc.save()
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="pitch-deck.pdf"'
      }
    })
  } catch (error: any) {
    console.error('Pitch deck generation error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.code || 'unknown_error'
    }, { status: 500 })
  }
} 