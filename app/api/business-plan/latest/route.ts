import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface AssetContent {
  businessPlan: {
    [key: string]: {
      title: string
      content: string[]
      metrics?: Array<{
        label: string
        value: string | number
        unit?: string
      }>
    }
  }
}

interface Asset {
  content: AssetContent
}

export async function GET(_request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the latest business plan
    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .select('content')
      .eq('user_id', session.user.id)
      .eq('asset_type', 'business_plan')
      .eq('status', 'completed')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single() as { data: Asset | null; error: Error | null }

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Business plan not found' }, { status: 404 })
    }

    // Return just the business plan data, not the PDF
    return NextResponse.json(asset.content.businessPlan)
  } catch (error: unknown) {
    console.error('Error fetching business plan:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch business plan'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
