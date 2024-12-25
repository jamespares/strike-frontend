import React from 'react'
import { DownloadButton } from '../buttons'

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

interface GenericDocumentViewerProps {
  title: string
  sections: Section[]
  onDownload?: () => Promise<void>
  downloadFormat?: string
  className?: string
}

export const GenericDocumentViewer: React.FC<GenericDocumentViewerProps> = ({
  title,
  sections,
  onDownload,
  downloadFormat,
  className = '',
}) => {
  return (
    <div className={`space-y-8 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {onDownload && (
          <DownloadButton onClick={onDownload} format={downloadFormat || 'PDF'} variant="outline" />
        )}
      </div>

      {sections?.map((section, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{section.title}</h2>

          {/* Content */}
          <div className="prose max-w-none">
            {Array.isArray(section.content) ? (
              <div className="space-y-2">
                {section.content.map((item, i) => (
                  <p key={i} className="text-gray-700">
                    • {item}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">{section.content}</p>
            )}
          </div>

          {/* Metrics */}
          {section.metrics && section.metrics.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Key Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.metrics.map((metric, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg">
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
        </div>
      ))}
    </div>
  )
}
