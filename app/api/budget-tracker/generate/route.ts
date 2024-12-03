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
  budget: number
  revenue_model: string
  fixed_costs: string
  variable_costs: string
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
          title: `Budget Tracker - ${new Date().toLocaleDateString()}`,
        },
        sheets: [
          { properties: { title: 'Budget Summary' } },
          { properties: { title: 'Fixed Costs' } },
          { properties: { title: 'Variable Costs' } },
          { properties: { title: 'Revenue Projections' } },
          { properties: { title: 'Cash Flow' } },
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

    // Initialize sheets with basic structure
    const requests = [
      // Budget Summary sheet
      {
        updateCells: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 2,
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'Category' } },
              { userEnteredValue: { stringValue: 'Amount' } },
            ],
          }],
          fields: 'userEnteredValue',
        },
      },
      // Fixed Costs sheet
      {
        updateCells: {
          range: {
            sheetId: 1,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 3,
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'Item' } },
              { userEnteredValue: { stringValue: 'Monthly Cost' } },
              { userEnteredValue: { stringValue: 'Annual Cost' } },
            ],
          }],
          fields: 'userEnteredValue',
        },
      },
      // Variable Costs sheet
      {
        updateCells: {
          range: {
            sheetId: 2,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 4,
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'Item' } },
              { userEnteredValue: { stringValue: 'Unit Cost' } },
              { userEnteredValue: { stringValue: 'Units' } },
              { userEnteredValue: { stringValue: 'Total Cost' } },
            ],
          }],
          fields: 'userEnteredValue',
        },
      },
    ]

    // Apply the formatting
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests,
      },
    })

    // Store in user_assets table
    const { data: asset, error: dbError } = await supabase
      .from('user_assets')
      .insert({
        user_id: userData.id,
        asset_type: 'budget_tracker',
        title: 'Budget Tracker',
        content: {
          googleSheetsUrl: spreadsheetUrl,
          spreadsheetId,
          sheets: [
            { name: 'Budget Summary', type: 'summary' },
            { name: 'Fixed Costs', type: 'fixed' },
            { name: 'Variable Costs', type: 'variable' },
            { name: 'Revenue Projections', type: 'revenue' },
            { name: 'Cash Flow', type: 'cashflow' },
          ],
          initialBudget: responses.budget,
          revenueModel: responses.revenue_model,
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
      message: 'Budget tracker created successfully',
    })
  } catch (error: any) {
    console.error('Error creating budget tracker:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create budget tracker' },
      { status: 500 }
    )
  }
} 