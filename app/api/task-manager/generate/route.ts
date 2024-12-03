import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { google } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SurveyQuestion } from '@/data/surveyQuestions'
import { supabase } from '@/lib/clients/supabaseClient'

interface SurveyResponse {
  problem: string
  solution: string
  timeline: string
  team_size: number
  key_milestones: string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from Supabase using email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    // Initialize Google Sheets API client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Task Manager - ${new Date().toLocaleDateString()}`,
        },
        sheets: [
          { properties: { title: 'Waterfall View' } },
          { properties: { title: 'Kanban View' } },
          { properties: { title: 'Categories' } },
        ],
      },
    })

    const spreadsheetId = spreadsheet.data.spreadsheetId
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

    // Set sharing permissions (anyone with link can view)
    const drive = google.drive({ version: 'v3', auth })
    await drive.permissions.create({
      fileId: spreadsheetId!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Store in user_assets table
    const { data: asset, error: dbError } = await supabase
      .from('user_assets')
      .insert({
        user_id: userData.id,
        asset_type: 'task_manager',
        title: 'Task Manager',
        content: {
          googleSheetsUrl: spreadsheetUrl,
          spreadsheetId,
          sheets: [
            { name: 'Waterfall View', type: 'gantt' },
            { name: 'Kanban View', type: 'kanban' },
            { name: 'Categories', type: 'list' },
          ],
        },
        status: 'completed',
        last_updated: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    return NextResponse.json({
      googleSheetsUrl: spreadsheetUrl,
      spreadsheetId,
      assetId: asset.id,
      message: 'Task manager created successfully',
    })
  } catch (error: any) {
    console.error('Error creating task manager:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create task manager' },
      { status: 500 }
    )
  }
} 