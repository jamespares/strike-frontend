'use client'

import { useEffect, useState } from 'react'
import DocumentViewer from '@/components/viewers/DocumentViewer'

interface CategoryData {
  score: number
  analysis: string
  positives: string[]
  negatives: string[]
}

interface IdeaEvaluation {
  problemScore: CategoryData
  marketScore: CategoryData
  solutionScore: CategoryData
  feasibilityScore: CategoryData
  businessModelScore: CategoryData
  overallScore: number
  recommendation: string
  nextSteps: string[]
}

export default function IdeaEvaluationPage() {
  const [evaluation, setEvaluation] = useState<IdeaEvaluation | null>(null)

  useEffect(() => {
    // Fetch the evaluation data when the component mounts
    const fetchEvaluation = async () => {
      try {
        const response = await fetch('/api/idea-evaluation/latest')
        if (!response.ok) throw new Error('Failed to fetch evaluation')
        const data = await response.json()
        setEvaluation(data)
      } catch (error) {
        console.error('Error fetching evaluation:', error)
      }
    }

    fetchEvaluation()
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/idea-evaluation/download')
      if (!response.ok) throw new Error('Failed to download')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'idea-evaluation.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading evaluation...</div>
      </div>
    )
  }

  // Transform evaluation data to match DocumentViewer format
  const content = {
    sections: [
      {
        title: 'Overall Evaluation',
        content: [
          `Overall Score: ${evaluation.overallScore}/100`,
          'Recommendation:',
          evaluation.recommendation
        ]
      },
      {
        title: 'Problem Analysis',
        content: [
          `Score: ${evaluation.problemScore.score}/100`,
          'Analysis:',
          evaluation.problemScore.analysis,
          'Strengths:',
          ...evaluation.problemScore.positives.map(p => `• ${p}`),
          'Weaknesses:',
          ...evaluation.problemScore.negatives.map(n => `• ${n}`)
        ]
      },
      {
        title: 'Market Analysis',
        content: [
          `Score: ${evaluation.marketScore.score}/100`,
          'Analysis:',
          evaluation.marketScore.analysis,
          'Opportunities:',
          ...evaluation.marketScore.positives.map(p => `• ${p}`),
          'Threats:',
          ...evaluation.marketScore.negatives.map(n => `• ${n}`)
        ]
      },
      {
        title: 'Solution Analysis',
        content: [
          `Score: ${evaluation.solutionScore.score}/100`,
          'Analysis:',
          evaluation.solutionScore.analysis,
          'Strengths:',
          ...evaluation.solutionScore.positives.map(p => `• ${p}`),
          'Weaknesses:',
          ...evaluation.solutionScore.negatives.map(n => `• ${n}`)
        ]
      },
      {
        title: 'Feasibility Analysis',
        content: [
          `Score: ${evaluation.feasibilityScore.score}/100`,
          'Analysis:',
          evaluation.feasibilityScore.analysis,
          'Advantages:',
          ...evaluation.feasibilityScore.positives.map(p => `• ${p}`),
          'Challenges:',
          ...evaluation.feasibilityScore.negatives.map(n => `• ${n}`)
        ]
      },
      {
        title: 'Business Model Analysis',
        content: [
          `Score: ${evaluation.businessModelScore.score}/100`,
          'Analysis:',
          evaluation.businessModelScore.analysis,
          'Strengths:',
          ...evaluation.businessModelScore.positives.map(p => `• ${p}`),
          'Risks:',
          ...evaluation.businessModelScore.negatives.map(n => `• ${n}`)
        ]
      },
      {
        title: 'Next Steps',
        content: evaluation.nextSteps.map((step, index) => `${index + 1}. ${step}`)
      }
    ]
  }

  return (
    <DocumentViewer
      title="Idea Evaluation"
      content={content}
      onDownload={handleDownload}
      downloadFormat="PDF"
    />
  )
} 