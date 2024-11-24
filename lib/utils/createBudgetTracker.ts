import ExcelJS from 'exceljs'
import { supabase } from '@/lib/clients/supabaseClient'

export const generateBudgetTracker = async (userId: string, projectPlan: any, surveyData: any): Promise<string> => {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Budget Tracker')

    // Define columns
    worksheet.columns = [
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ]

    // Add budget items
    projectPlan.budget.forEach(item => {
      worksheet.addRow({
        category: item.category,
        amount: item.amount,
        status: item.status
      })
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Upload to Supabase Storage under 'budget' folder
    const fileName = `budget/budget-${userId}-${Date.now()}.xlsx`
    const { data, error } = await supabase.storage
      .from('project-tools')
      .upload(fileName, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true
      })

    if (error) throw error

    // Get public URL
    const { data: publicUrl, error: urlError } = supabase.storage
      .from('project-tools')
      .getPublicUrl(fileName)

    if (urlError) throw urlError

    return publicUrl.publicUrl
  } catch (error) {
    console.error('Error creating Budget Tracker:', error)
    throw error
  }
}

export const generateBudgetCSV = async (projectPlan: any) => {
  // Your existing implementation
} 