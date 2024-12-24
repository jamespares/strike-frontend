import React from 'react'
import { DownloadButton } from '@/components'

interface Metric {
  label: string
  value: string | number
  unit?: string
}

interface Section {
  title: string
  content: string | string[]
  metrics?: Metric[]
}

interface DocumentViewerProps {
  title: string
  sections: Section[]
  onDownload?: () => Promise<void>
  downloadFormat?: string
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  title,
  sections,
  onDownload,
  downloadFormat,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {onDownload && <DownloadButton onClick={onDownload} format={downloadFormat || 'PDF'} />}
      </div>

      {sections?.map((section, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">{section.title}</h2>

          {/* Content */}
          <div className="prose max-w-none">
            {Array.isArray(section.content) ? (
              <ul className="list-disc pl-5 space-y-2">
                {section.content.map((item, i) => (
                  <li key={i} className="text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">{section.content}</p>
            )}
          </div>

          {/* Metrics */}
          {section.metrics && section.metrics.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.metrics.map((metric, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {metric.value}
                    {metric.unit && (
                      <span className="text-gray-600 text-sm ml-1">{metric.unit}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
