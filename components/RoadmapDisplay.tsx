import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { PDFDocument, rgb } from 'pdf-lib'
import html2canvas from 'html2canvas'

interface RoadmapDisplayProps {
  mermaidDefinition: string;
}

export function RoadmapDisplay({ mermaidDefinition }: RoadmapDisplayProps) {
  const roadmapRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    const initializeMermaid = async () => {
      try {
        await mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          flowchart: {
            curve: 'basis',
            padding: 50,
            nodeSpacing: 120,
            rankSpacing: 100,
            width: 1400,
            height: 400,
            defaultRenderer: 'dagre',
            htmlLabels: true,
            useMaxWidth: false,
            diagramPadding: 8
          },
          themeVariables: {
            primaryColor: '#fef3c7',
            primaryTextColor: '#1e293b',
            primaryBorderColor: '#334155',
            lineColor: '#334155',
            secondaryColor: '#fef3c7',
            tertiaryColor: '#fef3c7',
            fontSize: '16px',
            nodeBorder: '2px',
            mainBkg: '#ffffff',
            nodeBkg: '#fef3c7',
            arrowheadColor: '#334155',
            labelBackgroundColor: '#fef3c7',
            clusterBkg: '#fef3c7',
            nodeTextColor: '#1e293b',
            edgeLabelBackground: '#fef3c7',
            fillColor: '#fef3c7'
          },
          themeCSS: `
            .node rect { 
              stroke-width: 2px !important;
              rx: 6;
              ry: 6;
              stroke-dasharray: 5 !important;
            }
            .edgePath path {
              stroke-width: 2px !important;
              stroke-dasharray: 5 !important;
            }
            .edgePath marker {
              stroke-dasharray: 0 !important;
            }
            .label {
              font-family: 'Comic Sans MS', cursive !important;
            }
          `,
          securityLevel: 'loose'
        })

        if (roadmapRef.current && mermaidDefinition) {
          const { svg } = await mermaid.render('roadmap-diagram', mermaidDefinition)
          roadmapRef.current.innerHTML = svg
        }
      } catch (error) {
        console.error('Error initializing mermaid:', error)
      }
    }

    initializeMermaid()
  }, [mermaidDefinition])

  const handleDownloadPDF = async () => {
    if (!roadmapRef.current) return
    setIsGeneratingPDF(true)

    try {
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = '1400px'
      tempContainer.style.height = '400px'
      tempContainer.style.backgroundColor = '#ffffff'
      document.body.appendChild(tempContainer)

      const originalSvg = roadmapRef.current.querySelector('svg')
      if (originalSvg) {
        const clonedSvg = originalSvg.cloneNode(true) as SVGElement
        clonedSvg.style.width = '1400px'
        clonedSvg.style.height = '400px'
        clonedSvg.setAttribute('width', '1400')
        clonedSvg.setAttribute('height', '400')
        tempContainer.appendChild(clonedSvg)
      }

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: true,
        useCORS: true,
        allowTaint: true,
      })

      document.body.removeChild(tempContainer)

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
    <div className="bg-[#232a3b] rounded-xl p-8">
      <div ref={roadmapRef} className="mb-6 overflow-x-auto" />
      <button
        onClick={handleDownloadPDF}
        disabled={isGeneratingPDF}
        className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg 
                 text-white text-sm font-medium transition disabled:opacity-50"
      >
        {isGeneratingPDF ? 'Generating PDF...' : 'Download Roadmap PDF'}
      </button>
    </div>
  )
} 