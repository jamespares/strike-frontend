// app/api/google-sheets/create/route.ts
import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { supabase } from '../../../lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const { userId, sheetType, script } = await request.json()

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/script.projects'
      ],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const script = google.script({ version: 'v1', auth })

    // Create empty spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `${sheetType} - ${new Date().toLocaleDateString()}` }
      }
    })

    const spreadsheetId = spreadsheet.data.spreadsheetId!

    // Create and deploy script project
    const scriptProject = await script.projects.create({
      requestBody: {
        title: `${sheetType}Script`,
        parentId: spreadsheetId
      }
    })

    // Update script content and run it
    await script.projects.updateContent({
      scriptId: scriptProject.scriptId,
      requestBody: { files: [{ name: 'Code', type: 'SERVER_JS', source: script }] }
    })

    // Run the script
    await script.scripts.run({
      scriptId: scriptProject.scriptId,
      requestBody: { function: 'createSheet', parameters: [spreadsheetId] }
    })

    return NextResponse.json({ spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}