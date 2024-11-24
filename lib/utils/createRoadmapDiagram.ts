// utils/createRoadmapDiagram.ts
import { supabase } from '@/lib/clients/supabaseClient'
import mermaid from 'mermaid'

export const createRoadmapDiagram = async (userId: string, tasks: any[]) => {
  // Initialize mermaid config
  mermaid.initialize({ startOnLoad: false })
  
  // Create mermaid diagram syntax
  let mermaidCode = 'graph TD;\n'
  tasks.forEach((task, index) => {
    const taskId = `Task${index}`
    mermaidCode += `${taskId}["${task.task}"];\n`
    
    task.subtasks.forEach((subtask: string, subIndex: number) => {
      const subtaskId = `${taskId}_Sub${subIndex}`
      mermaidCode += `${taskId} --> ${subtaskId}["${subtask}"];\n`
    })
    
    // Add dependencies
    task.dependencies.forEach((dep: string) => {
      const depIndex = tasks.findIndex(t => t.task === dep)
      if (depIndex !== -1) {
        mermaidCode += `Task${depIndex} --> ${taskId};\n`
      }
    })
  })

  // Save to Supabase storage
  const fileName = `${userId}/roadmap.md`
  const { error } = await supabase.storage
    .from('user-assets')
    .upload(fileName, mermaidCode, {
      contentType: 'text/markdown',
      upsert: true
    })

  if (error) throw error

  const { publicURL } = supabase.storage
    .from('user-assets')
    .getPublicUrl(fileName)

  return publicURL
}
