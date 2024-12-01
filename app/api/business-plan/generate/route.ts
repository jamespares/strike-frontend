import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import OpenAI from 'openai'
import { ProjectPlan } from '@/lib/types/survey'
import { Document, Paragraph, HeadingLevel, TextRun, Packer } from 'docx'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function generateBusinessPlanContent(projectPlan: ProjectPlan) {
  const prompt = `Create a clear and engaging business plan that anyone can understand:
    ${JSON.stringify(projectPlan, null, 2)}

    Key principles:
    1. Write in a conversational, friendly tone
    2. Use real-world examples and comparisons
    3. Break down complex ideas into simple steps
    4. Focus on practical, achievable actions
    5. Explain the 'why' behind each decision

    Structure the content in these sections:
    1. Executive Summary (A clear overview anyone can understand)
    2. The Big Idea (What you're building and why it matters)
    3. Understanding Your Market (Who needs this and why)
    4. How It Works (Simple explanation of your product/service)
    5. Your Game Plan (Clear steps to make it happen)
    6. Growth Strategy (Practical ways to expand)
    7. Money Matters (Simple breakdown of costs and earnings)
    8. Next Steps (Clear action items)

    Make it engaging and practical - like you're explaining your plan to a friend who's interested in your business.`

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a friendly business advisor who explains complex ideas in simple, clear terms. Write like you're having a conversation, avoiding jargon and making everything practical and understandable."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
  })

  const response = completion.choices[0].message.content || ''
  return extractSections(response)
}

function extractSections(text: string) {
  const sectionTitles = [
    'Executive Summary',
    'Company Description',
    'Market Analysis',
    'Organization and Management',
    'Service or Product Line',
    'Marketing and Sales Strategy',
    'Financial Projections',
    'Growth Strategy'
  ]
  
  const sections: Record<string, string> = {}
  
  sectionTitles.forEach((title, index) => {
    const nextTitle = sectionTitles[index + 1]
    const regex = new RegExp(`${title}.*?${nextTitle ? `(?=${nextTitle})` : '$'}`, 's')
    const match = text.match(regex)
    if (match) {
      sections[title.toLowerCase().replace(/\s+/g, '')] = match[0]
        .replace(title, '')
        .trim()
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    }
  })
  
  return sections
}

function drawPageBackground(page: PDFPage) {
  const { width, height } = page.getSize()
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 1, 1) // White background
  })
}

function drawSectionHeader(page: PDFPage, text: string, y: number, font: PDFFont) {
  const { width } = page.getSize()
  
  // Draw header background
  page.drawRectangle({
    x: 0,
    y: y - 10,
    width,
    height: 40,
    color: rgb(0.95, 0.95, 0.95)
  })

  // Draw green accent line
  page.drawRectangle({
    x: 40,
    y: y - 5,
    width: 3,
    height: 30,
    color: rgb(0.2, 0.83, 0.6)
  })

  // Draw header text
  page.drawText(text, {
    x: 50,
    y,
    size: 18,
    font,
    color: rgb(0, 0, 0)
  })
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)

    if (width <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

async function generateDocx(sections: any) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "Business Plan",
          heading: HeadingLevel.TITLE,
        }),
        // Executive Summary
        new Paragraph({
          text: "1. Executive Summary",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: sections.executiveSummary || '' })],
          spacing: { after: 200 }
        }),
        // Company Description
        new Paragraph({
          text: "2. Company Description",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: sections.companyDescription || '' })],
          spacing: { after: 200 }
        }),
        // Market Analysis
        new Paragraph({
          text: "3. Market Analysis",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: sections.marketAnalysis || '' })],
          spacing: { after: 200 }
        }),
        // Organization and Management
        new Paragraph({
          text: "4. Organization and Management",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: sections.organizationAndManagement || '' })],
          spacing: { after: 200 }
        }),
        // Service or Product Line
        new Paragraph({
          text: "5. Service or Product Line",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: sections.serviceOrProductLine || '' })],
          spacing: { after: 200 }
        }),
        // Marketing and Sales Strategy
        new Paragraph({
          text: "6. Marketing and Sales Strategy",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: sections.marketingAndSales || '' })],
          spacing: { after: 200 }
        }),
        // Financial Projections
        new Paragraph({
          text: "7. Financial Projections",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: sections.financialProjections || '' })],
          spacing: { after: 200 }
        }),
        // Growth Strategy
        new Paragraph({
          text: "8. Growth Strategy",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({ text: sections.growthStrategy || '' })],
          spacing: { after: 200 }
        }),
      ],
    }],
  })

  return await Packer.toBuffer(doc)
}

export async function POST(request: Request) {
  try {
    const { projectPlan } = await request.json()
    if (!projectPlan) {
      console.error('Missing project plan in request')
      return NextResponse.json(
        { error: 'Project plan is required' },
        { status: 400 }
      )
    }

    console.log('Generating business plan content...')
    const businessPlanContent = await generateBusinessPlanContent(projectPlan)
    
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

    // Add title page
    let page = pdfDoc.addPage([595, 842]) // A4 size
    const { height } = page.getSize()
    drawPageBackground(page)

    // Title with green underline
    page.drawText('Business Plan', {
      x: 50,
      y: height - 100,
      size: 36,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0)
    })

    // Green underline for title
    page.drawRectangle({
      x: 50,
      y: height - 110,
      width: 200,
      height: 3,
      color: rgb(0.2, 0.83, 0.6)
    })

    // Company name
    page.drawText(projectPlan.companyName || 'Company Name', {
      x: 50,
      y: height - 150,
      size: 24,
      font: timesRomanFont,
      color: rgb(0.4, 0.4, 0.4)
    })

    // Add sections
    const sections = [
      { title: 'Executive Summary', content: businessPlanContent.executiveSummary },
      { title: 'Company Description', content: businessPlanContent.companyDescription },
      { title: 'Market Analysis', content: businessPlanContent.marketAnalysis },
      { title: 'Organization and Management', content: businessPlanContent.organizationAndManagement },
      { title: 'Service or Product Line', content: businessPlanContent.serviceOrProductLine },
      { title: 'Marketing and Sales Strategy', content: businessPlanContent.marketingAndSales },
      { title: 'Financial Projections', content: businessPlanContent.financialProjections },
      { title: 'Growth Strategy', content: businessPlanContent.growthStrategy }
    ]

    for (const section of sections) {
      page = pdfDoc.addPage([595, 842])
      drawPageBackground(page)

      // Draw section header with styling
      drawSectionHeader(page, section.title, height - 50, timesRomanBoldFont)

      // Section content
      const contentLines = (section.content || '').split('\n')
      let y = height - 100
      const maxWidth = 495 // 595 (page width) - 100 (margins)

      contentLines.forEach((paragraph: string) => {
        // Skip empty paragraphs
        if (!paragraph.trim()) {
          y -= 20
          return
        }

        // Wrap the paragraph text
        const wrappedLines = wrapText(paragraph.trim(), timesRomanFont, 12, maxWidth)

        for (const line of wrappedLines) {
          if (y < 50) {
            page = pdfDoc.addPage([595, 842])
            drawPageBackground(page)
            y = height - 50
          }

          page.drawText(line, {
            x: 50,
            y,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0)
          })

          y -= 20
        }

        // Add extra space after each paragraph
        y -= 10
      })
    }

    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes)

    console.log('Generating DOCX document...')
    const docxBuffer = await generateDocx(businessPlanContent)

    if (!docxBuffer || !pdfBuffer) {
      console.error('Failed to generate document buffers')
      return NextResponse.json(
        { error: 'Failed to generate documents' },
        { status: 500 }
      )
    }

    console.log('Creating form data response...')
    const formData = new FormData()
    formData.append('pdf', new Blob([pdfBuffer], { type: 'application/pdf' }), 'business-plan.pdf')
    formData.append('docx', new Blob([docxBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'business-plan.docx')

    console.log('Sending response...')
    return new Response(formData, {
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + Math.random().toString().substring(2),
      },
    })

  } catch (error: any) {
    console.error('Error generating business plan:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to generate business plan' },
      { status: 500 }
    )
  }
} 