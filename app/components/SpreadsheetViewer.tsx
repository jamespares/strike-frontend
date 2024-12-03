import React from 'react'
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

interface SpreadsheetViewerProps {
  title: string
  googleSheetsUrl: string
  onDownload: () => void
  downloadFormat: string
}

const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  title,
  googleSheetsUrl,
  onDownload,
  downloadFormat
}) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download {downloadFormat}
          </button>
          <a
            href={googleSheetsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            Open in Google Sheets
          </a>
        </div>
      </div>
      <iframe
        src={`${googleSheetsUrl}?embedded=true`}
        className="w-full flex-grow border-0 rounded-lg"
      />
    </div>
  )
}

export default SpreadsheetViewer 