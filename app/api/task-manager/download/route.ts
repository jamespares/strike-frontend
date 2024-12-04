import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the latest task manager
    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .select('content')
      .eq('user_id', session.user.id)
      .eq('asset_type', 'task_manager')
      .eq('status', 'completed')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Task manager not found' }, { status: 404 })
    }

    // Convert base64 PDF back to buffer
    const pdfBuffer = Buffer.from(asset.content.pdfBase64, 'base64')

    // Return the PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="task-manager.pdf"'
      }
    })
  } catch (error: any) {
    console.error('Error downloading task manager:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download task manager' },
      { status: 500 }
    )
  }
} 