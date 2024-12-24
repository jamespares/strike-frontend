import React from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Download } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface BusinessPlanSection {
  title: string
  content: string[]
  metrics?: {
    label: string
    value: string | number
    unit?: string
  }[]
}

interface BusinessPlanViewerProps {
  assetId: string
  content: {
    [key: string]: BusinessPlanSection
  }
  filePath?: string
}

export default function BusinessPlanViewer({
  assetId,
  content,
  filePath,
}: BusinessPlanViewerProps) {
  const supabase = createClientComponentClient()

  const downloadPDF = async () => {
    if (!filePath) return

    try {
      const { data, error } = await supabase.storage.from('business-plans').download(filePath)

      if (error) {
        console.error('Error downloading PDF:', error)
        return
      }

      // Create a download link
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `business-plan-${assetId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Business Plan</h2>
        {filePath && (
          <Button onClick={downloadPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>

      {Object.entries(content).map(([key, section]) => (
        <Card key={key} className="overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
            <div className="space-y-2">
              {section.content.map((item, index) => (
                <p key={index} className="text-gray-700">
                  • {item}
                </p>
              ))}
            </div>

            {section.metrics && section.metrics.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Key Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.metrics.map((metric, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{metric.label}</p>
                      <p className="text-lg font-semibold">
                        {metric.value}
                        {metric.unit && <span className="text-gray-500 ml-1">{metric.unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
