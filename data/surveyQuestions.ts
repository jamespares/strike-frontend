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
    fieldName: 'problem',
    question: "What problem are you trying to solve?",
    placeholder: "Freelancers waste 5+ hours per month on manual time tracking and expense management. Current solutions are complex and disconnected, requiring them to juggle multiple tools.",
    guidance: {
      title: "Think about the pain point:",
      items: [
        { icon: "😫", text: "PAIN: What frustrates people the most?" },
        { icon: "💸", text: "COST: How much time/money is wasted?" },
        { icon: "🎯", text: "SPECIFIC: Which exact user group has this problem?" },
        { icon: "🤔", text: "WHY NOW: Why hasn't this been solved before?" }
      ]
    }
  },
  {
    id: 2,
    fieldName: 'solution',
    question: "What do you want to build to solve this?",
    placeholder: "I'm building a SaaS tool that helps freelancers automate their time tracking and expense management. It uses Next.js for the frontend and Stripe for payments. The goal is to help freelancers save 5+ hours per month on admin work.",
    guidance: {
      title: "The more specific you are, the better:",
      items: [
        { icon: "💡", text: "WHAT: What exactly are you building?" },
        { icon: "⚒️", text: "HOW: How will you build it?" },
        { icon: "✨", text: "UNIQUE: What makes your solution different?" },
        { icon: "👥", text: "WHO: Who is it for?" }
      ]
    }
  },
  { 
    id: 3, 
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
    id: 4, 
    question: 'When do you want to ship your project?', 
    fieldName: 'deadline',
    placeholder: "01/03/2025",
    guidance: {
      title: "Planning your timeline:",
      items: [
        { icon: "⚡", text: "REALISTIC: Consider your available time and resources" },
        { icon: "🛡️", text: "BUFFER: Add 20-30% extra for unforeseen challenges" }
      ]
    }
  },
  { 
    id: 5, 
    question: 'How much can you spend to get it launched?', 
    fieldName: 'budget',
    placeholder: "$500",
    guidance: {
      title: "Calculate your launch budget:",
      items: [
        { icon: "💰", text: "MONTHLY: Consider recurring costs" },
        { icon: "⚔️", text: "ONE-TIME: Include setup/launch costs" },
        { icon: "📊", text: "DURATION: How many months until launch?" },
        { icon: "🛡️", text: "BUFFER: Add 20% for unexpected costs" }
      ]
    }
  },
  {
    id: 6,
    fieldName: 'pricing_model',
    question: "How will you make money?",
    placeholder: "Monthly subscription of $29/month for freelancers, with a higher tier at $49/month for small agencies. Annual plans will be offered at a 20% discount.",
    guidance: {
      title: "Define your pricing strategy:",
      items: [
        { icon: "💳", text: "MODEL: Subscription or one-time payment?" },
        { icon: "💰", text: "PRICE: How much will you charge?" },
        { icon: "📊", text: "TIERS: Will you have different pricing tiers?" },
        { icon: "🎯", text: "VALUE: Does the price match the value provided?" }
      ]
    }
  }
]
