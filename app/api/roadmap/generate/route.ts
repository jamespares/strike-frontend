import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'
import { ProjectPlan } from '@/lib/types/survey'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const execAsync = promisify(exec)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Generate d2 diagram content using AI
async function generateD2Content(projectPlan: ProjectPlan) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Create a d2 diagram showing project phases and milestones.
        Use only valid d2 syntax with these style guidelines:
        - Use 'fill' instead of 'background-color'
        - Use 'stroke' instead of 'border-color'
        - Use 'stroke-width' instead of 'border-width'
        - Use numeric values for border-radius (e.g. '4')
        
        Example valid styles:
        style: {
          fill: "#e6f3ff"
          stroke: "#2563eb"
          stroke-width: 2
          border-radius: 4
          shadow: true
          font-size: 14
        }
        
        Create a professional-looking roadmap with:
        1. Clear phase boxes
        2. Connected milestones
        3. Proper styling for visual hierarchy
        4. Logical flow between elements`
      },
      {
        role: 'user',
        content: `Create a roadmap diagram using this project plan:
        ${JSON.stringify({
          tasks: projectPlan.tasks,
          timeline: projectPlan.timeline,
          milestones: projectPlan.timeline.milestones
        }, null, 2)}`
      }
    ],
    temperature: 0.7
  })

  return response.choices[0].message.content || ''
}

// Handle the route
export async function POST(request: NextRequest) {
  try {
    const { projectPlan } = await request.json()
    if (!projectPlan) {
      console.error('Project plan required for roadmap generation')
      return NextResponse.json({ error: 'Project plan required' }, { status: 400 })
    }

    console.log('Generating D2 content...')
    const d2Content = await generateD2Content(projectPlan)
    
    if (!d2Content) {
      console.error('Failed to generate D2 content')
      return NextResponse.json({ error: 'Failed to generate roadmap content' }, { status: 500 })
    }

    // Log the generated D2 content for debugging
    console.log('Generated D2 content:', d2Content)
    
    // Create temp directory if it doesn't exist
    console.log('Setting up temp directory...')
    const tempDir = path.join(process.cwd(), 'tmp')
    await mkdir(tempDir, { recursive: true })
    
    // Generate unique filenames
    const timestamp = Date.now()
    const inputPath = path.join(tempDir, `roadmap-${timestamp}.d2`)
    const outputPath = path.join(tempDir, `roadmap-${timestamp}.pdf`)
    
    console.log('Writing D2 content to temp file...')
    await writeFile(inputPath, d2Content)
    
    console.log('Generating PDF using D2...')
    try {
      await execAsync(`d2 "${inputPath}" "${outputPath}" --layout=dagre --theme=200`)
    } catch (error: any) {
      console.error('D2 command failed:', error.message)
      console.error('D2 stderr:', error.stderr)
      throw new Error('Failed to generate roadmap diagram: ' + error.stderr)
    }
    
    console.log('Reading generated PDF...')
    const pdfBuffer = await readFile(outputPath)
    
    console.log('Cleaning up temp files...')
    await Promise.all([
      unlink(inputPath).catch(err => console.error('Failed to delete input file:', err)),
      unlink(outputPath).catch(err => console.error('Failed to delete output file:', err))
    ])

    console.log('Sending PDF response...')
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="roadmap.pdf"'
      }
    })
  } catch (error: any) {
    console.error('Roadmap generation error:', error)
    if (error.stderr) {
      console.error('D2 stderr:', error.stderr)
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Types
interface SurveyResponse {
  problem: string
  solution: string
  key_risks: string
  deadline: string
  budget: number
  pricing_model: string
}

interface RoadmapPhase {
  name: string
  description: string
  objectives: string[]
  keyMetrics: string[]
  timeline: string
  budget: string
  risks: string[]
}

interface RoadmapData {
  overview: string
  phases: RoadmapPhase[]
  criticalPath: string[]
  successMetrics: string[]
}