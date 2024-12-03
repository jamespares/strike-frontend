import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

interface BusinessPlanSection {
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
    const businessPlan = {
      sections: [
        {
          title: 'Executive Summary',
          content: [
            'Innovative SaaS solution targeting small business efficiency',
            'Market size of $5B with 15% YoY growth',
            'Experienced founding team with technical and business expertise'
          ],
          metrics: [
            { label: 'Market Size', value: 5, unit: 'B USD' },
            { label: 'Target Customers', value: '50K' },
            { label: 'Expected ROI', value: 85, unit: '%' }
          ]
        },
        {
          title: 'Market Analysis',
          content: `Detailed analysis of the target market, including size, growth trends, and competitive landscape. 
                   Key market segments and their specific needs. Analysis of market drivers and barriers to entry.`
        },
        {
          title: 'Business Model',
          content: [
            'Subscription-based pricing with tiered features',
            'Enterprise customization options',
            'Channel partnerships for distribution',
            'Professional services for implementation'
          ],
          metrics: [
            { label: 'Monthly ARPU', value: 299, unit: 'USD' },
            { label: 'CAC', value: 1200, unit: 'USD' },
            { label: 'LTV', value: 8500, unit: 'USD' }
          ]
        },
        {
          title: 'Financial Projections',
          content: `Five-year financial projections including revenue, costs, and profitability analysis. 
                   Detailed breakdown of operational costs and revenue streams.`,
          metrics: [
            { label: 'Year 1 Revenue', value: 1.2, unit: 'M USD' },
            { label: 'Break-even', value: 18, unit: 'months' },
            { label: 'Gross Margin', value: 75, unit: '%' }
          ]
        }
      ]
    }

    return NextResponse.json(businessPlan)
  } catch (error: any) {
    console.error('Error fetching business plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch business plan' },
      { status: 500 }
    )
  }
} 