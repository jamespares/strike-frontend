import { NextResponse } from 'next/server'
import { openai } from '@/lib/clients/openaiClient'
import { SurveyQuestion } from '@/data/surveyQuestions'
import ExcelJS from 'exceljs'

interface SurveyResponse {
  problem: string
  solution: string
  key_risks: string
  deadline: string
  budget: number
  pricing_model: string
}

interface Task {
  id: number
  name: string
  startDate: string
  endDate: string
  dependencies: number[]
  category: string
  description: string
}

interface GanttData {
  tasks: Task[]
  categories: string[]
}

export async function POST(request: Request) {
  try {
    const { responses, questions } = await request.json() as {
      responses: SurveyResponse
      questions: SurveyQuestion[]
    }

    if (!responses || !questions) {
      console.error('Missing survey responses or questions in request')
      return NextResponse.json(
        { error: 'Survey responses and questions are required' },
        { status: 400 }
      )
    }

    console.log('Generating Gantt chart data...')
    const ganttData = await generateGanttData(responses, questions)
    
    if (!ganttData || !ganttData.tasks.length) {
      console.error('Failed to generate Gantt chart data')
      return NextResponse.json(
        { error: 'Failed to generate Gantt chart data' },
        { status: 500 }
      )
    }

    console.log('Creating Excel workbook...')
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Project Timeline')

    // Set up columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: 'Task', key: 'name', width: 40 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Start Date', key: 'startDate', width: 12 },
      { header: 'End Date', key: 'endDate', width: 12 },
      { header: 'Dependencies', key: 'dependencies', width: 15 },
      { header: 'Description', key: 'description', width: 50 }
    ]

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F4EA' }
    }

    // Add tasks
    ganttData.tasks.forEach(task => {
      worksheet.addRow({
        id: task.id,
        name: task.name,
        category: task.category,
        startDate: task.startDate,
        endDate: task.endDate,
        dependencies: task.dependencies.join(', '),
        description: task.description
      })
    })

    // Add category summary sheet
    const summarySheet = workbook.addWorksheet('Categories')
    summarySheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Task Count', key: 'count', width: 15 }
    ]

    // Style the summary header
    summarySheet.getRow(1).font = { bold: true }
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F4EA' }
    }

    // Add category summaries
    const categoryCounts = ganttData.tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(categoryCounts).forEach(([category, count]) => {
      summarySheet.addRow({ category, count })
    })

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer()
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="project-timeline.xlsx"'
      }
    })
  } catch (error: any) {
    console.error('Error generating Gantt chart:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate Gantt chart' },
      { status: 500 }
    )
  }
}

async function generateGanttData(responses: SurveyResponse, questions: SurveyQuestion[]): Promise<GanttData> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "system",
        content: "You are an expert project manager. Create a detailed project timeline with tasks, dependencies, and categories based on the survey responses. Focus on realistic timelines and clear task breakdowns."
      },
      {
        role: "user",
        content: `Create a detailed project timeline based on these survey responses:

Questions and Answers:
${questions.map(q => `
Q: ${q.question}
A: ${responses[q.fieldName as keyof SurveyResponse]}
Context: ${q.guidance.title}
- ${q.guidance.items.map(item => item.text).join('\n- ')}
`).join('\n')}

Generate a project timeline with the following requirements:
1. Break down the project into clear, actionable tasks
2. Set realistic start and end dates based on the deadline
3. Identify dependencies between tasks
4. Categorize tasks (e.g., Development, Marketing, Legal)
5. Include clear task descriptions
6. Account for risks and potential delays
7. Include key milestones

Format the response as a JSON object with:
1. tasks: Array of task objects with {id, name, startDate, endDate, dependencies, category, description}
2. categories: Array of unique category names

Use realistic dates starting from today, and ensure all dates are in YYYY-MM-DD format.`
      }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}