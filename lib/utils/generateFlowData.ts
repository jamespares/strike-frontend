import { Node, Edge } from 'reactflow'
import { ProjectPlan } from '@/lib/types/survey'

export function generateFlowData(projectPlan: ProjectPlan): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const nodePositions = new Map<string, { x: number, y: number }>()
  
  // Sort tasks chronologically
  const sortedTasks = [...projectPlan.tasks].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  // Generate nodes with positions
  sortedTasks.forEach((task, index) => {
    const position = {
      x: index * 250,
      y: Math.floor(index / 2) * 100
    }
    nodePositions.set(task.id, position)
    
    nodes.push({
      id: task.id,
      position,
      data: { 
        label: `${task.title}\n${task.startDate}` 
      },
      type: 'default',
      style: {
        background: '#fef3c7',
        color: '#1e293b',
        border: '2px solid #334155',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '14px',
        width: 200,
      }
    })
  })

  // Generate edges based on dependencies
  sortedTasks.forEach(task => {
    if (task.dependencies) {
      task.dependencies.forEach(depId => {
        edges.push({
          id: `${depId}-${task.id}`,
          source: depId,
          target: task.id,
          type: 'smoothstep',
          style: { stroke: '#334155', strokeWidth: 2 },
          animated: true
        })
      })
    }
  })

  return { nodes, edges }
} 