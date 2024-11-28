import { useState } from 'react'

interface RoadmapGenerateButtonProps {
  projectPlan: any;
  onRoadmapGenerated: (roadmap: string) => void;
}

export function RoadmapGenerateButton({ projectPlan, onRoadmapGenerated }: RoadmapGenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ projectPlan }),
        credentials: 'include',
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate roadmap')
      }

      console.log('Generated roadmap:', data.roadmap)
      onRoadmapGenerated(data.roadmap)
    } catch (err: any) {
      console.error('Error generating roadmap:', err)
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-[#232a3b] rounded-xl p-8 text-center">
      <h2 className="text-2xl mb-6">Generate Project Roadmap</h2>
      <button
        onClick={handleGenerateRoadmap}
        disabled={isGenerating}
        className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700
                text-white rounded-xl text-lg font-semibold
                hover:from-amber-700 hover:to-amber-800
                transform hover:scale-105 active:scale-95
                transition duration-200 ease-in-out
                shadow-lg hover:shadow-xl
                border border-amber-500/30
                disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? 'Generating...' : 'Generate Roadmap'}
      </button>
      
      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}
    </div>
  )
} 