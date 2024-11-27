import { ProjectPlan } from '@/lib/types/survey'
import { PDFDocument, rgb } from 'pdf-lib'
import { useState } from 'react'
import { formatProjectPlanToText } from '@/lib/utils/formatProjectPlan'

export function ProjectPlanDisplay({ plan }: { plan: ProjectPlan }) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const text = formatProjectPlanToText(plan)

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
      link.download = 'project-plan.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="bg-[#232a3b] rounded-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl">Your Project Plan</h2>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg 
                     text-sm font-medium transition disabled:opacity-50"
        >
          {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>
      
      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-200">
        {text}
      </pre>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <details>
          <summary className="cursor-pointer text-sm text-gray-400">
            View Raw JSON
          </summary>
          <pre className="mt-2 bg-[#1a1f2e] p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}