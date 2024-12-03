import React from 'react'
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

interface PresentationViewerProps {
  title: string
  googleSlidesUrl: string
  onDownload: () => void
  downloadFormat: 'PowerPoint' | 'Keynote'
}

export default function PresentationViewer({
  title,
  googleSlidesUrl,
  onDownload,
  downloadFormat
}: PresentationViewerProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex gap-4">
            <a
              href={googleSlidesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 
                       text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white 
                       hover:bg-gray-50 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-emerald-500"
            >
              <ArrowTopRightOnSquareIcon className="mr-2 h-5 w-5" />
              Open in Google Slides
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

      {/* Embedded Google Slides */}
      <div className="w-full h-[calc(100vh-5rem)] bg-gray-900">
        <iframe
          src={`${googleSlidesUrl}?embedded=true&rm=minimal&start=false&loop=false&delayms=3000`}
          className="w-full h-full border-0"
          title={title}
          allowFullScreen
        />
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 
                    bg-white rounded-full shadow-lg border border-gray-200 
                    px-4 py-2 flex items-center space-x-4">
        <button
          onClick={() => {
            // Send message to iframe to go to previous slide
            const iframe = document.querySelector('iframe')
            iframe?.contentWindow?.postMessage('{"command":"prevSlide"}', '*')
          }}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => {
            // Send message to iframe to go to next slide
            const iframe = document.querySelector('iframe')
            iframe?.contentWindow?.postMessage('{"command":"nextSlide"}', '*')
          }}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
} 