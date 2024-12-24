import { useCallback } from 'react'
import ReactFlow, { Node, Edge, Controls, Background, ConnectionMode, Panel } from 'reactflow'
import 'reactflow/dist/style.css'

interface RoadmapFlowProps {
  nodes: Node[]
  edges: Edge[]
  onDownloadPDF: () => void
  isGeneratingPDF: boolean
}

export function RoadmapFlow({ nodes, edges, onDownloadPDF, isGeneratingPDF }: RoadmapFlowProps) {
  const onInit = useCallback(() => {
    // Optional: Add any initialization logic
  }, [])

  return (
    <div className="bg-[#232a3b] rounded-xl p-8">
      <div className="h-[600px] mb-6">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={onInit}
          connectionMode={ConnectionMode.Strict}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <button
        onClick={onDownloadPDF}
        disabled={isGeneratingPDF}
        className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg 
                 text-white text-sm font-medium transition disabled:opacity-50"
      >
        {isGeneratingPDF ? 'Generating PDF...' : 'Download Roadmap PDF'}
      </button>
    </div>
  )
}
