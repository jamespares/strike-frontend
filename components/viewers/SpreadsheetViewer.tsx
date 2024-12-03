import React from 'react'
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

interface SpreadsheetViewerProps {
  title: string
  googleSheetsUrl: string
  onDownload: () => void
  downloadFormat: string
}

export default function SpreadsheetViewer({
  title,
  googleSheetsUrl,
  onDownload,
  downloadFormat
}: SpreadsheetViewerProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex gap-4">
            <a
              href={googleSheetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 
                       text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white 
                       hover:bg-gray-50 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-emerald-500"
            >
              <ArrowTopRightOnSquareIcon className="mr-2 h-5 w-5" />
              Open in Google Sheets
            </a>
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
      </div>

      {/* Embedded Google Sheets */}
      <div className="w-full h-[calc(100vh-5rem)]">
        <iframe
          src={`${googleSheetsUrl}?embedded=true&rm=minimal`}
          className="w-full h-full border-0"
          title={title}
        />
      </div>
    </div>
  )
} 