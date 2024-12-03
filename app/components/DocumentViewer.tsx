import React from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface DocumentViewerProps {
  title: string
  content: {
    sections: {
      title: string
      content: string | string[]
      metrics?: {
        label: string
        value: string | number
        unit?: string
      }[]
    }[]
  }
  onDownload: () => void
  downloadFormat: string
}

export default function DocumentViewer({
  title,
  content,
  onDownload,
  downloadFormat
}: DocumentViewerProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <button
            onClick={onDownload}
            className="inline-flex items-center px-4 py-2 border border-transparent 
                     text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 
                     hover:bg-emerald-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-emerald-500"
          >
            <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
            Download {downloadFormat}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {content.sections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className={`px-6 py-5 ${
                sectionIndex !== content.sections.length - 1
                  ? 'border-b border-gray-200'
                  : ''
              }`}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 relative inline-block">
                {section.title}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 transform -rotate-1 translate-y-1"></div>
              </h2>

              {/* Metrics Grid if present */}
              {section.metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {section.metrics.map((metric, metricIndex) => (
                    <div
                      key={metricIndex}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <dt className="text-sm font-medium text-gray-500">
                        {metric.label}
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        {metric.value}
                        {metric.unit && (
                          <span className="text-sm text-gray-500 ml-1">
                            {metric.unit}
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Content */}
              <div className="prose prose-emerald max-w-none">
                {Array.isArray(section.content) ? (
                  <ul className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <span className="text-emerald-500 mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {section.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 