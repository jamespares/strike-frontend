import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pptx'
    const presentationId = searchParams.get('id')

    if (!presentationId) {
      return NextResponse.json({ error: 'Presentation ID is required' }, { status: 400 })
    }

    // Initialize Google Drive API client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Export the presentation in the requested format
    const mimeType = format === 'key' 
      ? 'application/vnd.apple.keynote'
      : 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

    const response = await drive.files.export({
      fileId: presentationId,
      mimeType: mimeType,
    }, {
      responseType: 'arraybuffer'
    })

    const buffer = Buffer.from(response.data as ArrayBuffer)

    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Disposition', `attachment; filename="pitch-deck.${format}"`)

    return new NextResponse(buffer, {
      status: 200,
      headers: headers,
    })
  } catch (error: any) {
    console.error('Error downloading pitch deck:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download pitch deck' },
      { status: 500 }
    )
  }
} 