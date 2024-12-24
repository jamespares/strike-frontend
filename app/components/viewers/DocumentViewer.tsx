import React from 'react'

interface Metric {
  label: string
  value: string | number
  unit?: string
}

interface Section {
  title: string
  content: string[]
  metrics?: Metric[]
}

interface DocumentContent {
  sections: Section[]
}

interface DocumentViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  content: {
    sections?: Section[]
  }
  onDownload: () => Promise<void>
  downloadFormat: string
}

const DocumentViewer = ({
  title,
  content,
  onDownload,
  downloadFormat,
  ...props
}: DocumentViewerProps) => {
  // Handle business plan format
  if ('sections' in content) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {title && (
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {onDownload && (
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Download {downloadFormat}
              </button>
            )}
          </div>
        )}

        {content.sections?.map((section: Section, index: number) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{section.title}</h2>

            {/* Content */}
            <div className="prose max-w-none">
              <ul className="list-disc pl-5 space-y-2">
                {section.content.map((item: string, i: number) => (
                  <li key={i} className="text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Metrics */}
            {section.metrics?.map((metric: Metric, i: number) => (
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
        ))}
      </div>
    )
  }

  // Handle roadmap format
  return (
    <div className="max-w-4xl mx-auto p-6">
      {title && (
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Download {downloadFormat}
            </button>
          )}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md p-6">
        <pre className="whitespace-pre-wrap text-sm text-gray-700">{JSON.stringify(content, null, 2)}</pre>
      </div>
    </div>
  )
}

export default DocumentViewer
