import { ProjectPlan } from '@/lib/types/survey'
import * as XLSX from 'xlsx'

export function generateGanttSpreadsheet(projectPlan: ProjectPlan): Uint8Array {
  if (!projectPlan?.tasks?.length) {
    throw new Error('Project plan must contain tasks')
  }

  try {
    const wb = XLSX.utils.book_new()

    // Main task sheet
    const taskData = [
      ['ID', 'Task', 'Start Date', 'End Date', 'Duration', 'Dependencies', 'Cost', 'Resources', 'Status'],
      ...projectPlan.tasks.map((task, index) => [
        task.id,
        task.title,
        new Date(task.startDate),
        new Date(task.endDate),
        { f: `=NETWORKDAYS(C${index + 2},D${index + 2})` },
        task.dependencies.join(', '),
        task.estimatedCost,
        task.assignedTo.join(', '),
        'Not Started'
      ])
    ]

    const wsTask = XLSX.utils.aoa_to_sheet(taskData)

    // Timeline sheet with milestones
    const timelineData = [
      ['Milestone', 'Date', 'Description'],
      ...projectPlan.timeline.milestones.map(milestone => [
        milestone.description,
        new Date(milestone.date),
        milestone.description
      ])
    ]

    const wsTimeline = XLSX.utils.aoa_to_sheet(timelineData)

    // Budget sheet
    const budgetData = [
      ['Category', 'Amount', 'Notes'],
      ...Object.entries(projectPlan.budget.breakdown).map(([category, amount]) => [
        category,
        amount,
        ''
      ]),
      ['Contingency', projectPlan.budget.contingency, ''],
      ['Total Budget', projectPlan.budget.total, '']
    ]

    const wsBudget = XLSX.utils.aoa_to_sheet(budgetData)

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsTask, 'Tasks')
    XLSX.utils.book_append_sheet(wb, wsTimeline, 'Timeline')
    XLSX.utils.book_append_sheet(wb, wsBudget, 'Budget')

    // Format dates and columns
    const sheets = ['Tasks', 'Timeline'].map(name => wb.Sheets[name])
    sheets.forEach(sheet => {
      if (!sheet['!ref']) return
      const range = XLSX.utils.decode_range(sheet['!ref'])
      for (let R = 1; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
          const cell = XLSX.utils.encode_cell({r: R, c: C})
          if (sheet[cell] && sheet[cell].t === 'd') { // if cell contains date
            sheet[cell].z = 'mm/dd/yyyy'
          }
        }
      }
    })

    return XLSX.write(wb, {
      type: 'array',
      bookType: 'xlsx',
      cellDates: true,
      dateNF: 'mm/dd/yyyy'
    })
  } catch (error) {
    console.error('Error generating spreadsheet:', error)
    throw new Error(`Spreadsheet generation failed: ${error.message}`)
  }
} 