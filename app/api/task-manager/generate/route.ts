import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { google } from 'googleapis'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SurveyQuestion } from '@/data/surveyQuestions'

interface SurveyResponse {
  id: string
  product: string
  motivation: string
  progress: string
  challenges: string
  deadline: string
  budget: string | number
}

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  assignee?: string
  category: string
}

export async function POST(request: Request) {
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
        asset_type: 'task_manager',
        title: 'Task Manager',
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

    // Generate initial tasks using OpenAI
    const prompt = `Create a project task list based on:
    Product: ${responses.product}
    Motivation/Problem: ${responses.motivation}
    Current Progress: ${responses.progress}
    Key Challenges: ${responses.challenges}
    Timeline: ${responses.deadline}
    Budget: $${responses.budget}
    
    Format the response as a JSON array of tasks, each with:
    - id: string (unique identifier)
    - title: string
    - description: string
    - status: 'todo' | 'in_progress' | 'done'
    - priority: 'low' | 'medium' | 'high'
    - dueDate: string (YYYY-MM-DD)
    - category: string
    
    Include tasks for:
    - Project Setup & Planning
    - Development & Implementation
    - Testing & Quality Assurance
    - Marketing & Launch
    - Post-Launch Support
    
    Consider the current progress and challenges when creating the task list.
    Prioritize tasks that address the key challenges identified.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content generated from OpenAI')
    }

    const tasks = JSON.parse(content).tasks as Task[]

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || ''),
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const drive = google.drive({ version: 'v3', auth })

    // Create new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Task Manager',
        },
        sheets: [
          { properties: { title: 'Waterfall View', sheetId: 0 } },
          { properties: { title: 'Kanban View', sheetId: 1 } },
          { properties: { title: 'Categories', sheetId: 2 } },
        ],
      },
    })

    const spreadsheetId = spreadsheet.data.spreadsheetId
    if (!spreadsheetId) {
      throw new Error('Failed to create Google Sheets spreadsheet')
    }

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

    // Set up sheet formatting and populate with tasks (implementation details omitted for brevity)
    // ... sheet setup logic ...

    // Set sharing permissions
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    })

    // Update the asset record with the generated content
    const { error: updateError } = await supabase
      .from('user_assets')
      .update({
        content: {
          googleSheetsUrl: spreadsheetUrl,
          spreadsheetId,
          sheets: [
            { name: 'Waterfall View', type: 'gantt' },
            { name: 'Kanban View', type: 'kanban' },
            { name: 'Categories', type: 'list' }
          ],
          tasks
        },
        status: 'completed'
      })
      .eq('id', asset.id)

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`)
    }

    return NextResponse.json({
      message: 'Task manager created successfully',
      assetId: asset.id,
      googleSheetsUrl: spreadsheetUrl,
      spreadsheetId,
      tasks
    })
  } catch (error: any) {
    console.error('Error creating task manager:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create task manager' },
      { status: 500 }
    )
  }
} 