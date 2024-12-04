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

    // Get the latest business plan
    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .select('content')
      .eq('user_id', session.user.id)
      .eq('asset_type', 'business_plan')
      .eq('status', 'completed')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Business plan not found' }, { status: 404 })
    }

    // Return just the business plan data, not the PDF
    return NextResponse.json(asset.content.businessPlan)
  } catch (error: any) {
    console.error('Error fetching business plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch business plan' },
      { status: 500 }
    )
  }
} 