// utils/createGoogleSheets.ts
import { google } from 'googleapis'

export const createGoogleSheets = async (userId: string, projectData: any) => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })

  // Create a new spreadsheet
  const resource = {
    properties: {
      title: `Project Plan for ${userId}`,
    },
  }

  const spreadsheet = await sheets.spreadsheets.create({
    resource,
    fields: 'spreadsheetId',
  })

  const spreadsheetId = spreadsheet.data.spreadsheetId

  // Prepare data for Gantt chart, budget tracker, and risk log
  // ...

  // Add sheets and populate data
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Add sheets
        {
          addSheet: {
            properties: {
              title: 'Gantt Chart',
            },
          },
        },
        {
          addSheet: {
            properties: {
              title: 'Budget Tracker',
            },
          },
        },
        {
          addSheet: {
            properties: {
              title: 'Risk Log',
            },
          },
        },
        // Additional requests to populate data
      ],
    },
  })

  // Populate Gantt Chart
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Gantt Chart!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['Task', 'Start Date', 'End Date', 'Assigned To', 'Status'],
        // Map projectData.tasks to rows
      ],
    },
  })

  // Similarly, populate Budget Tracker and Risk Log

  // Share the spreadsheet with the user (requires their email)
  // Fetch user email from Supabase
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    console.error('Error fetching user email:', userError?.message)
    return
  }

  const drive = google.drive({ version: 'v3', auth })

  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      role: 'writer',
      type: 'user',
      emailAddress: userData.email,
    },
  })

  // Get the spreadsheet URL
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`

  // Save the spreadsheet URL to Supabase or return it
  await supabase
    .from('user_assets')
    .update({ spreadsheet_url: spreadsheetUrl })
    .eq('user_id', userId)
}
