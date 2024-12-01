import { useState } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'
import { ProjectPlan } from '@/lib/types/survey'

interface BusinessPlanDisplayProps {
  plan: ProjectPlan
}

function formatBusinessPlanToText(plan: ProjectPlan): string {
  const sections = []

  // Goals
  sections.push('# Executive Summary\n')
  sections.push(plan.executiveSummary || '')
  sections.push('\n')

  // Company Description
  sections.push('# Company Description\n')
  sections.push(plan.companyDescription || '')
  sections.push('\n')

  // Market Analysis
  sections.push('# Market Analysis\n')
  sections.push(plan.marketAnalysis || '')
  sections.push('\n')

  // Organization and Management
  sections.push('# Organization and Management\n')
  sections.push(plan.organizationAndManagement || '')
  sections.push('\n')

  // Service or Product Line
  sections.push('# Service or Product Line\n')
  sections.push(plan.serviceOrProduct || '')
  sections.push('\n')

  // Marketing and Sales Strategy
  sections.push('# Marketing and Sales Strategy\n')
  sections.push(plan.marketingStrategy || '')
  sections.push('\n')

  // Financial Projections
  sections.push('# Financial Projections\n')
  sections.push(plan.financialProjections || '')
  sections.push('\n')

  // Growth Strategy
  sections.push('# Growth Strategy\n')
  sections.push(plan.growthStrategy || '')
  sections.push('\n')

  return sections.join('')
}

export function BusinessPlanDisplay({ plan }: BusinessPlanDisplayProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const text = formatBusinessPlanToText(plan)

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const pdfDoc = await PDFDocument.create()
      let page = pdfDoc.addPage()
      const { height } = page.getSize()
      
      const pdfText = text
        .replace(/─/g, '-')
        .split('\n')
        .filter(line => line.trim())
      
      let y = height - 50
      
      pdfText.forEach(line => {
        const text = line.replace(/[#*`]/g, '').trim()
        if (!text) return
        
        const fontSize = line.startsWith('# ') ? 24 : 
                        line.startsWith('## ') ? 18 : 
                        line.startsWith('### ') ? 14 : 12
        
        if (y < 50) {
          page = pdfDoc.addPage()
          y = height - 50
        }
        
        page.drawText(text, {
          x: 50,
          y,
          size: fontSize,
          color: rgb(0, 0, 0)
        })
        
        y -= fontSize * 1.5
      })
      
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'business-plan.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap font-mono text-sm">{text}</div>
      <button
        onClick={handleDownloadPDF}
        disabled={isGeneratingPDF}
        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium
                 hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                 transition duration-200 ease-in-out shadow-sm disabled:opacity-50"
      >
        {isGeneratingPDF ? 'Generating PDF...' : 'Download Business Plan'}
      </button>
    </div>
  )
} 