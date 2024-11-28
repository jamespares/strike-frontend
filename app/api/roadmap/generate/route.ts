import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/clients/supabaseServer'
import { generateRoadmap } from '@/lib/utils/generateRoadmap'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const [{ data: { user }, error: userError }] = await Promise.all([
      supabase.auth.getUser()
    ])
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const projectPlan = body.projectPlan

    if (!projectPlan) {
      return NextResponse.json({ 
        error: 'Project plan data is required in request body' 
      }, { status: 400 })
    }

    console.log('Generating roadmap with project plan:', projectPlan)
    const mermaidDefinition = await generateRoadmap(projectPlan)
    
    return NextResponse.json({ success: true, roadmap: mermaidDefinition })
  } catch (error: any) {
    console.error('Roadmap generation error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.code || 'unknown_error'
    }, { status: 500 })
  }
} 