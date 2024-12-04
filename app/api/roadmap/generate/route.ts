import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'
import { ProjectPlan } from '@/lib/types/survey'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { responses, questions } = await request.json() as {
      responses: SurveyResponse
      questions: SurveyQuestion[]
    }

    if (!responses || !questions) {
      return NextResponse.json(
        { error: 'Survey responses and questions are required' },
        { status: 400 }
      )
    }

    // Create initial asset record
    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .insert({
        user_id: session.user.id,
        asset_type: 'roadmap',
        title: 'Project Roadmap',
        status: 'generating',
        content: null
      })
      .select()
      .single()

    if (assetError) {
      console.error('Error creating asset record:', assetError)
      return NextResponse.json(
        { error: 'Failed to initialize asset generation' },
        { status: 500 }
      )
    }

    // Generate D2 diagram content using OpenAI
    const prompt = `Create a D2 diagram showing project phases and milestones based on:
    Problem: ${responses.problem}
    Key Risks: ${responses.key_risks}
    Timeline: ${responses.deadline}
    Budget: $${responses.budget}
    Revenue Model: ${responses.pricing_model}
    
    Use valid D2 syntax with these style guidelines:
    - Use 'fill' instead of 'background-color'
    - Use 'stroke' instead of 'border-color'
    - Use 'stroke-width' instead of 'border-width'
    - Use numeric values for border-radius (e.g. '4')
    
    Create a professional roadmap with:
    1. Clear phase boxes
    2. Connected milestones
    3. Proper styling for visual hierarchy
    4. Logical flow between elements
    5. Timeline indicators`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })

    const d2Content = completion.choices[0].message.content
    if (!d2Content) {
      throw new Error('No content generated from OpenAI')
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'tmp')
    await mkdir(tempDir, { recursive: true })

    // Generate unique filenames
    const timestamp = Date.now()
    const inputPath = path.join(tempDir, `roadmap-${timestamp}.d2`)
    const outputPath = path.join(tempDir, `roadmap-${timestamp}.pdf`)

    // Write D2 content to temp file
    await writeFile(inputPath, d2Content)

    // Generate PDF using D2
    try {
      await execAsync(`d2 "${inputPath}" "${outputPath}" --layout=dagre --theme=200`)
    } catch (error: any) {
      console.error('D2 command failed:', error.message)
      console.error('D2 stderr:', error.stderr)
      throw new Error('Failed to generate roadmap diagram: ' + error.stderr)
    }

    // Read generated PDF
    const pdfBuffer = await readFile(outputPath)

    // Clean up temp files
    await Promise.all([
      unlink(inputPath).catch(err => console.error('Failed to delete input file:', err)),
      unlink(outputPath).catch(err => console.error('Failed to delete output file:', err))
    ])

    // Convert PDF to base64 for storage
    const pdfBase64 = pdfBuffer.toString('base64')

    // Update the asset record with the generated content
    const { error: updateError } = await supabase
      .from('user_assets')
      .update({
        content: {
          pdfBase64,
          diagramData: d2Content
        },
        status: 'completed'
      })
      .eq('id', asset.id)

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    // Return PDF directly in the response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="roadmap.pdf"'
      }
    })
  } catch (error: any) {
    console.error('Error generating roadmap:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate roadmap' },
      { status: 500 }
    )
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