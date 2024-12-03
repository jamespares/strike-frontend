import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getServerSession } from 'next-auth'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize Google Slides API client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/presentations'],
    })

    const slides = google.slides({ version: 'v1', auth })

    // Create a new presentation
    const presentation = await slides.presentations.create({
      requestBody: {
        title: `Pitch Deck - ${new Date().toLocaleDateString()}`,
      },
    })

    const presentationId = presentation.data.presentationId
    const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`

    // Set sharing permissions (anyone with link can view)
    const drive = google.drive({ version: 'v3', auth })
    await drive.permissions.create({
      fileId: presentationId!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return NextResponse.json({
      googleSlidesUrl: presentationUrl,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error creating pitch deck presentation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create pitch deck' },
      { status: 500 }
    )
  }
} 