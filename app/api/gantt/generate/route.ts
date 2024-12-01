import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/clients/supabaseServer'
import ExcelJS from 'exceljs'

async function generateGanttChart(projectPlan: any) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Gantt Chart')

  // Set up columns
  worksheet.columns = [
    { header: 'Task', key: 'task', width: 40 },
    { header: 'Start Date', key: 'start', width: 15 },
    { header: 'End Date', key: 'end', width: 15 },
    { header: 'Duration (days)', key: 'duration', width: 15 },
    { header: 'Progress', key: 'progress', width: 15 },
    { header: 'Dependencies', key: 'dependencies', width: 20 }
  ]

  // Style the header row
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  // Add tasks from project plan
  if (projectPlan.milestones) {
    let rowIndex = 2
    for (const milestone of projectPlan.milestones) {
      worksheet.addRow({
        task: milestone.title,
        start: milestone.startDate || 'TBD',
        end: milestone.endDate || 'TBD',
        duration: milestone.duration || 'N/A',
        progress: milestone.progress || '0%',
        dependencies: milestone.dependencies?.join(', ') || ''
      })

      // Style the task row
      const row = worksheet.getRow(rowIndex)
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
      rowIndex++
    }
  }

  return workbook
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
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

    console.log('Generating Gantt chart with project plan:', projectPlan)
    const workbook = await generateGanttChart(projectPlan)
    const buffer = await workbook.xlsx.writeBuffer()
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="gantt-chart.xlsx"'
      }
    })
  } catch (error: any) {
    console.error('Gantt chart generation error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.code || 'unknown_error'
    }, { status: 500 })
  }
} 