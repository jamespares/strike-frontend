import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/clients/supabaseServer'
import { generateGanttSpreadsheet } from '@/lib/utils/generateGanttSpreadsheet'

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
        error: 'Project plan data is required' 
      }, { status: 400 })
    }

    console.log('Project Plan received:', JSON.stringify(projectPlan, null, 2))

    try {
      const spreadsheetData = generateGanttSpreadsheet(projectPlan)
      console.log('Spreadsheet generated successfully')
      
      return new NextResponse(spreadsheetData, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="project-gantt.xlsx"'
        }
      })
    } catch (genError) {
      console.error('Spreadsheet generation error:', genError)
      throw new Error(`Failed to generate spreadsheet: ${genError.message}`)
    }
  } catch (error: any) {
    console.error('Gantt spreadsheet generation error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.stack || error.code || 'unknown_error'
    }, { status: 500 })
  }
} 