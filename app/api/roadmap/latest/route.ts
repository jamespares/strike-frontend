import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

interface RoadmapSection {
  title: string
  content: string | string[]
  metrics?: {
    label: string
    value: string | number
    unit?: string
  }[]
}

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In a real application, you would fetch this from a database
    // This is a mock response for demonstration
    const roadmap = {
      sections: [
        {
          title: 'Phase 1: Foundation (Q1)',
          content: [
            'Core product architecture setup',
            'Basic user authentication and authorization',
            'MVP feature development',
            'Initial infrastructure deployment'
          ],
          metrics: [
            { label: 'Duration', value: 3, unit: 'months' },
            { label: 'Team Size', value: 4, unit: 'people' },
            { label: 'Key Deliverables', value: 5 }
          ]
        },
        {
          title: 'Phase 2: Core Features (Q2)',
          content: [
            'Advanced user management',
            'Integration capabilities',
            'Analytics dashboard',
            'Payment processing system'
          ],
          metrics: [
            { label: 'Duration', value: 3, unit: 'months' },
            { label: 'Team Size', value: 6, unit: 'people' },
            { label: 'Key Deliverables', value: 8 }
          ]
        },
        {
          title: 'Phase 3: Enhancement (Q3)',
          content: [
            'Performance optimization',
            'Advanced reporting features',
            'Mobile application development',
            'Third-party integrations'
          ],
          metrics: [
            { label: 'Duration', value: 3, unit: 'months' },
            { label: 'Team Size', value: 8, unit: 'people' },
            { label: 'Key Deliverables', value: 6 }
          ]
        },
        {
          title: 'Phase 4: Scale (Q4)',
          content: [
            'Enterprise features',
            'Advanced security measures',
            'Global infrastructure scaling',
            'Automated deployment pipeline'
          ],
          metrics: [
            { label: 'Duration', value: 3, unit: 'months' },
            { label: 'Team Size', value: 10, unit: 'people' },
            { label: 'Key Deliverables', value: 7 }
          ]
        }
      ]
    }

    return NextResponse.json(roadmap)
  } catch (error: any) {
    console.error('Error fetching roadmap:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roadmap' },
      { status: 500 }
    )
  }
} 