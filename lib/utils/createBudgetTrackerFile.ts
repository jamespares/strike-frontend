import ExcelJS from 'exceljs'

export const createBudgetTrackerFile = async (projectData: any, surveyData: any): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Budget Tracker')

  // Add headers
  worksheet.columns = [
    { header: 'Category', key: 'category', width: 30 },
    { header: 'Allocated', key: 'allocated', width: 15 },
    { header: 'Spent', key: 'spent', width: 15 },
    { header: 'Remaining', key: 'remaining', width: 15 },
  ]

  // Add data
  projectData.budgetDetails.forEach((item: any) => {
    worksheet.addRow({
      category: item.category,
      allocated: item.allocated,
      spent: item.spent,
      remaining: item.allocated - item.spent,
    })
  })

  // Add formulas, formatting as needed

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
} 