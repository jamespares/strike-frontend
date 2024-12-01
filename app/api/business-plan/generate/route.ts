import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Theme colors matching website
const colors = {
  black: rgb(0, 0, 0),
  gray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.95, 0.95, 0.95),
  emerald: rgb(0.2, 0.83, 0.6)
}

async function generateBusinessPlanContent(projectPlan: any) {
  const prompt = `
    Based on the following project plan, generate a comprehensive business plan. Include detailed analysis and specific recommendations.
    Project Plan: ${JSON.stringify(projectPlan)}

    Please provide the following sections:
    1. Executive Summary
    2. Company Description
    3. Market Analysis (include market size, trends, and competitor analysis)
    4. Organization and Management
    5. Service or Product Line
    6. Marketing and Sales Strategy
    7. Key Goals and Milestones (3-month, 6-month, 1-year, and 3-year goals)
    8. Risk Analysis and Mitigation Strategies
    9. Financial Projections
       - Include realistic revenue projections based on industry averages
       - Cost structure analysis
       - Break-even analysis
       - Cash flow projections
    10. Scaling Strategy and Recommendations
        - Growth phases
        - Resource requirements
        - Infrastructure needs
        - Best practices for scaling in this industry

    Format each section clearly and provide specific, actionable information.
  `

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an experienced business consultant who creates detailed, realistic business plans. Provide specific, actionable insights and realistic financial projections based on industry standards."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
  })

  const response = completion.choices[0].message.content || ''
  
  // Parse the response into sections
  const sections = {
    executiveSummary: extractSection(response, "Executive Summary"),
    companyDescription: extractSection(response, "Company Description"),
    marketAnalysis: extractSection(response, "Market Analysis"),
    organizationAndManagement: extractSection(response, "Organization and Management"),
    serviceOrProductLine: extractSection(response, "Service or Product Line"),
    marketingAndSales: extractSection(response, "Marketing and Sales Strategy"),
    keyGoals: extractSection(response, "Key Goals and Milestones"),
    riskAnalysis: extractSection(response, "Risk Analysis and Mitigation Strategies"),
    financialProjections: extractSection(response, "Financial Projections"),
    scalingStrategy: extractSection(response, "Scaling Strategy and Recommendations")
  }

  return sections
}

function extractSection(text: string, sectionTitle: string): string {
  const regex = new RegExp(`${sectionTitle}.*?(?=\\d+\\.\\s|$)`, 's')
  const match = text.match(regex)
  return match ? match[0].replace(sectionTitle, '').trim() : ''
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
    color: colors.lightGray
  })

  // Draw green accent line
  page.drawRectangle({
    x: 40,
    y: y - 5,
    width: 3,
    height: 30,
    color: colors.emerald
  })

  // Draw header text
  page.drawText(text, {
    x: 50,
    y,
    size: 18,
    font,
    color: colors.black
  })
}

export async function POST(request: Request) {
  try {
    const { projectPlan } = await request.json()
    if (!projectPlan) {
      return NextResponse.json(
        { error: 'Project plan is required' },
        { status: 400 }
      )
    }

    // Generate expanded business plan content using AI
    const businessPlanContent = await generateBusinessPlanContent(projectPlan)

    // Create PDF
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
      color: colors.black
    })

    // Green underline for title
    page.drawRectangle({
      x: 50,
      y: height - 110,
      width: 200,
      height: 3,
      color: colors.emerald
    })

    // Company name
    page.drawText(projectPlan.companyName || 'Company Name', {
      x: 50,
      y: height - 150,
      size: 24,
      font: timesRomanFont,
      color: colors.gray
    })

    // Add sections
    const sections = [
      { title: 'Executive Summary', content: businessPlanContent.executiveSummary },
      { title: 'Company Description', content: businessPlanContent.companyDescription },
      { title: 'Market Analysis', content: businessPlanContent.marketAnalysis },
      { title: 'Organization and Management', content: businessPlanContent.organizationAndManagement },
      { title: 'Service or Product Line', content: businessPlanContent.serviceOrProductLine },
      { title: 'Marketing and Sales Strategy', content: businessPlanContent.marketingAndSales },
      { title: 'Key Goals and Milestones', content: businessPlanContent.keyGoals },
      { title: 'Risk Analysis and Mitigation Strategies', content: businessPlanContent.riskAnalysis },
      { title: 'Financial Projections', content: businessPlanContent.financialProjections },
      { title: 'Scaling Strategy and Recommendations', content: businessPlanContent.scalingStrategy }
    ]

    for (const section of sections) {
      page = pdfDoc.addPage([595, 842])
      drawPageBackground(page)

      // Draw section header with styling
      drawSectionHeader(page, section.title, height - 50, timesRomanBoldFont)

      // Section content
      const contentLines = (section.content || '').split('\n')
      let y = height - 100

      contentLines.forEach((line: string) => {
        if (y < 50) {
          page = pdfDoc.addPage([595, 842])
          drawPageBackground(page)
          y = height - 50
        }

        page.drawText(String(line).trim(), {
          x: 50,
          y,
          size: 12,
          font: timesRomanFont,
          color: colors.black
        })

        y -= 20
      })
    }

    const pdfBytes = await pdfDoc.save()
    const buffer = Buffer.from(pdfBytes)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="business-plan.pdf"',
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating business plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate business plan' },
      { status: 500 }
    )
  }
} 