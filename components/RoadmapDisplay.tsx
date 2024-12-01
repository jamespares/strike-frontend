import { useEffect, useState } from 'react'
import { PDFDocument, rgb } from 'pdf-lib'
import html2canvas from 'html2canvas'
import { ProjectPlan } from '@/lib/types/survey'
import { RoadmapFlow } from './RoadmapFlow'
import { Node, Edge } from 'reactflow'

interface RoadmapDisplayProps {
  projectPlan: ProjectPlan
}

function generateFlowData(projectPlan: ProjectPlan) {
  const nodes: Node[] = []
  const edges: Edge[] = []
  
  // Sort tasks by start date
  const sortedTasks = [...projectPlan.tasks].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  // Create nodes for each task
  sortedTasks.forEach((task, index) => {
    nodes.push({
      id: task.id,
      type: 'taskNode',
      position: { x: index * 250, y: 100 },
      data: {
        title: task.title,
        startDate: task.startDate,
        endDate: task.endDate,
        description: task.description
      }
    })

    // Create edges based on dependencies
    if (task.dependencies) {
      task.dependencies.forEach(depId => {
        edges.push({
          id: `${depId}-${task.id}`,
          source: depId,
          target: task.id,
          type: 'smoothstep',
          animated: true
        })
      })
    }
  })

  // Add milestone nodes
  projectPlan.timeline.milestones.forEach((milestone, index) => {
    nodes.push({
      id: `milestone-${index}`,
      type: 'milestoneNode',
      position: { x: index * 250, y: 250 },
      data: {
        description: milestone.description,
        date: milestone.date
      }
    })
  })

  return { nodes, edges }
}

export function RoadmapDisplay({ projectPlan }: RoadmapDisplayProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { nodes, edges } = generateFlowData(projectPlan)

  const handleDownloadPDF = async () => {
    if (!document.querySelector('.react-flow')) return
    setIsGeneratingPDF(true)

    try {
      const canvas = await html2canvas(document.querySelector('.react-flow')!, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: true,
        useCORS: true,
        allowTaint: true,
      })

      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([842, 595]) // A4 landscape
      
      const pngImage = await canvas.toDataURL('image/png', 1.0)
      const image = await pdfDoc.embedPng(pngImage)
      
      const { width, height } = page.getSize()
      const scaleFactor = Math.min(width / canvas.width, height / canvas.height) * 0.9
      
      page.drawImage(image, {
        x: (width - canvas.width * scaleFactor) / 2,
        y: (height - canvas.height * scaleFactor) / 2,
        width: canvas.width * scaleFactor,
        height: canvas.height * scaleFactor,
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'project-roadmap.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <RoadmapFlow
      nodes={nodes}
      edges={edges}
      onDownloadPDF={handleDownloadPDF}
      isGeneratingPDF={isGeneratingPDF}
    />
  )
} 