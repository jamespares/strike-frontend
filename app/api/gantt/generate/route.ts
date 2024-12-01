import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/clients/supabaseServer'
import { ProjectPlan } from '@/lib/types/survey'
import ExcelJS from 'exceljs'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function generateAIContent(projectPlan: ProjectPlan) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert project management consultant. Generate comprehensive spreadsheet content.
        Return a JSON object containing:
        
        1. Executive Dashboard KPIs:
        - Project health metrics
        - Budget vs actual tracking
        - Risk assessment scores
        - Timeline progress indicators
        
        2. Financial Analysis:
        - Revenue projections
        - ROI calculations
        - Cash flow forecasts
        - Break-even analysis
        
        3. Risk Matrix:
        - Risk probability scores
        - Impact assessments
        - Mitigation effectiveness
        - Contingency triggers
        
        Return ONLY a valid JSON object.`
      },
      {
        role: 'user',
        content: `Generate professional spreadsheet metrics using this project plan:
        ${JSON.stringify(projectPlan, null, 2)}`
      }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  })

  return JSON.parse(response.choices[0].message.content)
}

async function generateGanttChart(projectPlan: ProjectPlan) {
  try {
    const workbook = new ExcelJS.Workbook()
    const aiContent = await generateAIContent(projectPlan)
    
    // Tasks Sheet
    console.log('Creating tasks sheet...')
    const tasksSheet = workbook.addWorksheet('Tasks')
    tasksSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Task', key: 'task', width: 40 },
      { header: 'Start Date', key: 'start', width: 15 },
      { header: 'End Date', key: 'end', width: 15 },
      { header: 'Duration (days)', key: 'duration', width: 15 },
      { header: 'Dependencies', key: 'dependencies', width: 20 },
      { header: 'Resources', key: 'resources', width: 20 },
      { header: 'Cost', key: 'cost', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ]

    // Style the header row
    const headerRow = tasksSheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add tasks
    console.log('Adding tasks to sheet...')
    projectPlan.tasks.forEach((task, index) => {
      const startDate = new Date(task.startDate)
      const endDate = new Date(task.endDate)
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      tasksSheet.addRow({
        id: task.id,
        task: task.title,
        start: startDate,
        end: endDate,
        duration,
        dependencies: task.dependencies?.join(', ') || '',
        resources: task.assignedTo?.join(', ') || '',
        cost: task.estimatedCost,
        status: 'Not Started'
      })

      // Style the task row
      const row = tasksSheet.getRow(index + 2)
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Format dates
      row.getCell('start').numFmt = 'mm/dd/yyyy'
      row.getCell('end').numFmt = 'mm/dd/yyyy'
      row.getCell('cost').numFmt = '"$"#,##0.00'
    })

    // Add conditional formatting to Tasks sheet
    tasksSheet.addConditionalFormatting({
      ref: 'A2:I1000',
      rules: [
        {
          type: 'expression',
          formulae: ['AND(TODAY()>D2,I2<>"Completed")'],
          style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFF0000' } } }
        },
        {
          type: 'expression',
          formulae: ['I2="Completed"'],
          style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF90EE90' } } }
        }
      ]
    })

    // Add data validation for Status
    tasksSheet.dataValidations.add('I2:I1000', {
      type: 'list',
      allowBlank: true,
      formulae: ['"Not Started,In Progress,Completed,Blocked"']
    })

    // Add AI-generated Dashboard sheet
    const dashboardSheet = workbook.addWorksheet('Executive Dashboard')
    // Add KPIs and metrics from aiContent

    // Timeline Sheet
    console.log('Creating timeline sheet...')
    const timelineSheet = workbook.addWorksheet('Timeline')
    timelineSheet.columns = [
      { header: 'Milestone', key: 'milestone', width: 40 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Description', key: 'description', width: 50 }
    ]

    // Style the header row
    const timelineHeader = timelineSheet.getRow(1)
    timelineHeader.font = { bold: true }
    timelineHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add milestones
    console.log('Adding milestones to timeline...')
    projectPlan.timeline.milestones.forEach((milestone, index) => {
      timelineSheet.addRow({
        milestone: milestone.description,
        date: new Date(milestone.date),
        description: milestone.description
      })

      // Style the milestone row
      const row = timelineSheet.getRow(index + 2)
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Format date
      row.getCell('date').numFmt = 'mm/dd/yyyy'
    })

    // Budget Sheet
    console.log('Creating budget sheet...')
    const budgetSheet = workbook.addWorksheet('Budget')
    budgetSheet.columns = [
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 }
    ]

    // Style the header row
    const budgetHeader = budgetSheet.getRow(1)
    budgetHeader.font = { bold: true }
    budgetHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add budget items
    console.log('Adding budget items...')
    Object.entries(projectPlan.budget.breakdown).forEach(([category, amount], index) => {
      budgetSheet.addRow({
        category,
        amount
      })

      // Style the budget row
      const row = budgetSheet.getRow(index + 2)
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Format amount
      row.getCell('amount').numFmt = '"$"#,##0.00'
    })

    // Add total and contingency
    const totalRow = budgetSheet.addRow({
      category: 'Contingency',
      amount: projectPlan.budget.contingency
    })
    totalRow.font = { bold: true }
    totalRow.getCell('amount').numFmt = '"$"#,##0.00'

    const grandTotalRow = budgetSheet.addRow({
      category: 'Total Budget',
      amount: projectPlan.budget.total
    })
    grandTotalRow.font = { bold: true }
    grandTotalRow.getCell('amount').numFmt = '"$"#,##0.00'

    return workbook
  } catch (error) {
    console.error('Error generating enhanced Gantt chart:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  console.group('📊 Gantt Chart Generation')
  try {
    const supabase = createServerClient()
    console.log('Checking authentication...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Authentication failed:', userError)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const projectPlan = body.projectPlan as ProjectPlan

    if (!projectPlan) {
      console.error('No project plan provided')
      return NextResponse.json({ 
        error: 'Project plan data is required in request body' 
      }, { status: 400 })
    }

    console.log('Generating Gantt chart...')
    const workbook = await generateGanttChart(projectPlan)
    
    console.log('Converting to buffer...')
    const buffer = await workbook.xlsx.writeBuffer()
    
    console.log('Gantt chart generation completed successfully')
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
  } finally {
    console.groupEnd()
  }
} 