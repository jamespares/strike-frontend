'use client'

import { useEffect, useState } from 'react'
import PresentationViewer from '@/components/viewers/PresentationViewer'

interface PitchDeckData {
  googleSlidesUrl: string
  lastUpdated: string
}

export default function PitchDeckPage() {
  const [pitchDeck, setPitchDeck] = useState<PitchDeckData | null>(null)

  useEffect(() => {
    // Fetch the pitch deck data when the component mounts
    const fetchPitchDeck = async () => {
      try {
        const response = await fetch('/api/pitch-deck/latest')
        if (!response.ok) throw new Error('Failed to fetch pitch deck')
        const data = await response.json()
        setPitchDeck(data)
      } catch (error) {
        console.error('Error fetching pitch deck:', error)
      }
    }

    fetchPitchDeck()
  }, [])

  const handleDownload = async () => {
    try {
      // Extract presentation ID from Google Slides URL
      const presentationId = pitchDeck?.googleSlidesUrl.split('/')[5]
      const response = await fetch(`/api/pitch-deck/download?id=${presentationId}&format=pptx`)
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pitch-deck.pptx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  if (!pitchDeck) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading pitch deck...</div>
      </div>
    )
  }

  return (
    <PresentationViewer
      title="Pitch Deck"
      googleSlidesUrl={pitchDeck.googleSlidesUrl}
      onDownload={handleDownload}
      downloadFormat="PowerPoint"
    />
  )
} 