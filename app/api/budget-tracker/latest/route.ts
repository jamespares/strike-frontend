import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getServerSession } from 'next-auth'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
          { properties: { title: 'Recurring Costs' } },
        ],
      },
    })

    const spreadsheetId = spreadsheet.data.spreadsheetId
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

    // Set sharing permissions (anyone with link can view)
    const drive = google.drive({ version: 'v3', auth })
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return NextResponse.json({
      googleSheetsUrl: spreadsheetUrl,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error creating budget tracker spreadsheet:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create budget tracker' },
      { status: 500 }
    )
  }
} 