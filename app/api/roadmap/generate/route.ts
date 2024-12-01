import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/clients/supabaseServer'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

async function generateRoadmap(projectPlan: any) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  
  // Add title
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 24
  const title = 'Project Roadmap'
  const titleWidth = font.widthOfTextAtSize(title, fontSize)
  
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 50,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })

  // Add project milestones
  const milestoneFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const milestoneFontSize = 12
  let yOffset = height - 100

  if (projectPlan.milestones) {
    for (const milestone of projectPlan.milestones) {
      page.drawText(`• ${milestone.title}`, {
        x: 50,
        y: yOffset,
        size: milestoneFontSize,
        font: milestoneFont,
        color: rgb(0, 0, 0),
      })
      yOffset -= 20

      if (milestone.description) {
        page.drawText(`  ${milestone.description}`, {
          x: 70,
          y: yOffset,
          size: milestoneFontSize,
          font: milestoneFont,
          color: rgb(0.4, 0.4, 0.4),
        })
        yOffset -= 30
      }
    }
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

    console.log('Generating roadmap with project plan:', projectPlan)
    const pdfDoc = await generateRoadmap(projectPlan)
    const pdfBytes = await pdfDoc.save()
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="roadmap.pdf"'
      }
    })
  } catch (error: any) {
    console.error('Roadmap generation error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.code || 'unknown_error'
    }, { status: 500 })
  }
} 