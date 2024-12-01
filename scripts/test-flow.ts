import { generateBusinessPlanContent } from '../app/api/business-plan/generate/route'
import { generateGanttChart } from '../app/api/gantt/generate/route'
import { generatePitchDeck } from '../app/api/pitch-deck/generate/route'

async function testFlow() {
  console.log('Starting flow test...')

  const testSurveyData = {
    key_goals: "Build a SaaS product",
    key_risks: "Technical complexity, market fit",
    deadline: "2024-12-31",
    budget: 5000,
    problem: "Manual process is slow",
    solution: "Automated solution saves time"
  }

  try {
    console.log('Testing asset generation...')
    
    console.log('Generating business plan...')
    const businessPlan = await generateBusinessPlanContent(testSurveyData)
    console.log('Business plan generated successfully')

    console.log('Generating Gantt chart...')
    const ganttChart = await generateGanttChart(testSurveyData)
    console.log('Gantt chart generated successfully')

    console.log('Generating pitch deck...')
    const pitchDeck = await generatePitchDeck(testSurveyData)
    console.log('Pitch deck generated successfully')

    console.log('All assets generated successfully!')
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testFlow() 