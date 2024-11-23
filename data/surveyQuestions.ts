export interface SurveyQuestion {
  id: number
  fieldName: string
  question: string
  placeholder: string
  guidance: {
    title: string
    items: {
      icon: string
      text: string
    }[]
  }
  validation?: {
    type: 'string' | 'number' | 'date'
    format?: string
    min?: number
    max?: number
  }
}

export const surveyQuestions: SurveyQuestion[] = [
  {
    id: 1,
    fieldName: 'key_goals',
    question: "What do you want to build?",
    placeholder: "I'm building a SaaS tool that helps freelancers automate their time tracking and expense management. It uses Next.js for the frontend and Stripe for payments. The goal is to help freelancers save 5+ hours per month on admin work.",
    guidance: {
      title: "Your quest needs clear purpose and direction:",
      items: [
        { icon: "🎯", text: "WHAT: Describe your product in one clear sentence" },
        { icon: "⚒️", text: "TECH: List the main technologies you'll use" },
        { icon: "💎", text: "VALUE: What specific problem does it solve?" },
        { icon: "👥", text: "USERS: Who will benefit from this?" },
        { icon: "📊", text: "METRICS: How will you measure success?" }
      ]
    }
  },
  { 
    id: 2, 
    fieldName: 'key_risks',
    question: "What challenges could delay or derail your project?",
    placeholder: "The payment integration is complex and might take 3-4 weeks longer than planned. I also have limited experience with Next.js, which could slow down development. There's a risk of missing the launch date if these issues compound.",
    guidance: {
      title: "Identify the obstacles in your path:",
      items: [
        { icon: "🔥", text: "TECHNICAL: What parts are most complex?" },
        { icon: "⚠️", text: "SKILLS: Where might you struggle?" },
        { icon: "⏳", text: "TIME: What could cause delays?" },
        { icon: "💫", text: "IMPACT: How would these affect launch?" }
      ]
    }
  },
  { 
    id: 3, 
    question: 'When do you want to ship your project?', 
    fieldName: 'deadline',
    placeholder: "Target completion: 01/03/2024. First beta release by 15/01/2024. Full launch with payment system by 01/03/2024.",
    guidance: {
      title: "Planning your timeline:",
      items: [
        { icon: "⚡", text: "REALISTIC: Consider your available time and resources" },
        { icon: "🛡️", text: "BUFFER: Add 20-30% extra for unforeseen challenges" }
      ]
    }
  },
  { 
    id: 4, 
    question: 'How much will it cost, roughly?', 
    fieldName: 'budget',
    placeholder: "I'll have monthly costs of $50 hosting, $20 design tools, $100 marketing. One-time costs could be $500 for logo/branding. Total needed for first 3 months would be $1010 with $100 a month ongoing.",
    guidance: {
      title: "Calculate your resource requirements:",
      items: [
        { icon: "💰", text: "MONTHLY: Consider recurring costs like hosting, customer support tools etc" },
        { icon: "⚔️", text: "ONE-TIME: Include setup/launch costs" },
        { icon: "📊", text: "DURATION: How long might this last you?" },
        { icon: "🛡️", text: "BUFFER: Add 20% for unexpected costs" }
      ]
    }
  }
]
