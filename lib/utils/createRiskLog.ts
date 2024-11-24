// utils/createRiskLog.ts
import ExcelJS from 'exceljs'
import { supabase } from '@/lib/clients/supabaseClient'
import { openai } from '@/lib/clients/openaiClient'

export const generateRiskLog = async (userId: string, risks: any[], surveyData: any) => {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Risk Analysis')

    // Set up columns
    worksheet.columns = [
      { header: 'Risk', key: 'risk', width: 40 },
      { header: 'Impact', key: 'impact', width: 30 },
      { header: 'Probability', key: 'probability', width: 15 },
      { header: 'Severity', key: 'severity', width: 15 },
      { header: 'Mitigation', key: 'mitigation', width: 40 }
    ]

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2B5FB6' }
    }

    // Add risk data
    risks.forEach((risk, index) => {
      worksheet.addRow({
        risk: risk.description,
        impact: risk.impact,
        probability: risk.probability,
        severity: risk.severity,
        mitigation: risk.mitigation
      })
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Upload to Supabase Storage
    const fileName = `risks/${userId}-${Date.now()}.xlsx`
    const { data, error } = await supabase.storage
      .from('project-tools')
      .upload(fileName, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true
      })

    if (error) throw error

    const { data: publicUrl } = supabase.storage
      .from('project-tools')
      .getPublicUrl(fileName)

    return publicUrl.publicUrl
  } catch (error) {
    console.error('Error creating risk log:', error)
    return null
  }
}

export const generateRiskCSV = async (risks: any[]) => {
  // Your existing implementation
} 