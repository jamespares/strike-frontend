import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ProjectPlan } from '@/lib/types/survey'
import PptxGenJS from 'pptxgenjs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function generatePitchDeckContent(projectPlan: ProjectPlan) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Create a pitch deck outline in JSON format with these sections:
        {
          "problemStatement": ["Problem point 1", "Problem point 2", "Problem point 3"],
          "solution": ["Solution point 1", "Solution point 2", "Solution point 3"],
          "market": ["Market point 1", "Market point 2", "Market point 3"],
          "businessModel": ["Business model point 1", "Business model point 2", "Business model point 3"],
          "goToMarket": ["Go-to-market point 1", "Go-to-market point 2", "Go-to-market point 3"],
          "financials": ["Financial point 1", "Financial point 2", "Financial point 3"],
          "team": ["Team point 1", "Team point 2", "Team point 3"],
          "investment": ["Investment point 1", "Investment point 2", "Investment point 3"]
        }

        For each section:
        - Write 3-4 clear, impactful bullet points
        - Include relevant metrics and data points
        - Keep content concise and compelling
        - Ensure each point is a complete sentence
        - Return ONLY valid JSON, no markdown or other formatting`
      },
      {
        role: 'user',
        content: `Create a pitch deck using this project plan:
        ${JSON.stringify(projectPlan, null, 2)}`
      }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  })

  try {
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }
    
    const parsedContent = JSON.parse(content)
    console.log('Generated content:', JSON.stringify(parsedContent, null, 2))
    return parsedContent
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error)
    console.error('Raw response:', response.choices[0].message.content)
    throw new Error('Failed to generate pitch deck content')
  }
}

async function createPowerPoint(content: any) {
  const pres = new PptxGenJS()
  
  // Title slide
  const titleSlide = pres.addSlide()
  titleSlide.addText("Pitch Deck", {
    x: '10%',
    y: '40%',
    w: '80%',
    fontSize: 44,
    bold: true,
    align: 'center',
    color: '363636'
  })

  // Content slides
  const sections = [
    { title: 'Problem Statement', content: content.problemStatement },
    { title: 'Solution Overview', content: content.solution },
    { title: 'Market Opportunity', content: content.market },
    { title: 'Business Model', content: content.businessModel },
    { title: 'Go-to-Market Strategy', content: content.goToMarket },
    { title: 'Financial Projections', content: content.financials },
    { title: 'Team & Vision', content: content.team },
    { title: 'Investment Ask', content: content.investment }
  ]

  sections.forEach(section => {
    if (!section.content) return

    const slide = pres.addSlide()
    
    // Add section title
    slide.addText(section.title, {
      x: '5%',
      y: '5%',
      w: '90%',
      h: '15%',
      fontSize: 32,
      bold: true,
      color: '363636'
    })

    // Add bullet points
    const bulletPoints = Array.isArray(section.content) ? section.content : [section.content]
    
    // Add each bullet point as a separate text element
    bulletPoints.forEach((point, index) => {
      slide.addText(point, {
        x: '7%',
        y: `${25 + (index * 12)}%`,
        w: '86%',
        h: '10%',
        fontSize: 18,
        color: '666666',
        bullet: { type: 'bullet' }
      })
    })
  })

  // Return as buffer
  return await pres.write({ outputType: 'nodebuffer' })
}

export async function POST(request: NextRequest) {
  try {
    const { projectPlan } = await request.json()
    if (!projectPlan) {
      return NextResponse.json(
        { error: 'Project plan is required' },
        { status: 400 }
      )
    }

    console.log('Generating pitch deck content...')
    const pitchDeckContent = await generatePitchDeckContent(projectPlan)

    if (!pitchDeckContent) {
      console.error('No content generated for pitch deck')
      return NextResponse.json(
        { error: 'Failed to generate pitch deck content' },
        { status: 500 }
      )
    }

    console.log('Creating PowerPoint presentation...')
    console.log('Content structure:', JSON.stringify(pitchDeckContent, null, 2))
    
    const pptxBuffer = await createPowerPoint(pitchDeckContent)

    console.log('Sending response...')
    return new NextResponse(pptxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="pitch-deck.pptx"'
      }
    })

  } catch (error: any) {
    console.error('Error generating pitch deck:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to generate pitch deck' },
      { status: 500 }
    )
  }
} 