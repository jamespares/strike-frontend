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
    fieldName: 'product',
    question: "What do you want to build?",
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
    id: 2,
    fieldName: 'motivation',
    question: "Why are you building this?",
    placeholder: "Freelancers waste 5+ hours per month on manual time tracking and expense management. Current solutions are complex and disconnected, requiring them to juggle multiple tools. I've experienced this pain firsthand and believe there's a big opportunity to solve it.",
    guidance: {
      title: "Think about the problem and opportunity:",
      items: [
        { icon: "😫", text: "PAIN: What problem are you solving?" },
        { icon: "💸", text: "MARKET: How big is this opportunity?" },
        { icon: "🎯", text: "USERS: Who needs this the most?" },
        { icon: "🤔", text: "TIMING: Why is now the right time?" }
      ]
    }
  },
  {
    id: 3,
    fieldName: 'progress',
    question: "What have you done so far?",
    placeholder: "I've created wireframes in Figma and validated the idea with 10 potential customers. I've also started learning Next.js and have a basic landing page set up. Two freelancers have offered to be beta testers.",
    guidance: {
      title: "Tell us about your progress:",
      items: [
        { icon: "🎯", text: "VALIDATION: Have you validated the idea?" },
        { icon: "💻", text: "TECHNICAL: What have you built?" },
        { icon: "📊", text: "RESEARCH: What market research have you done?" },
        { icon: "🤝", text: "TEAM: Do you have any team members or advisors?" }
      ]
    }
  },
  { 
    id: 4, 
    fieldName: 'challenges',
    question: "What are the biggest obstacles to a successful launch?",
    placeholder: "The payment integration is complex and might take longer than planned. I also have limited experience with Next.js, which could slow down development. Finding early adopters willing to switch from their current tools could be challenging.",
    guidance: {
      title: "Identify the key challenges:",
      items: [
        { icon: "🔥", text: "TECHNICAL: What parts are most complex?" },
        { icon: "⚠️", text: "MARKET: What could prevent adoption?" },
        { icon: "⏳", text: "TIME: What might cause delays?" },
        { icon: "💫", text: "SKILLS: Where might you need help?" }
      ]
    }
  },
  { 
    id: 5, 
    question: 'When do you want to launch it?', 
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
    id: 6, 
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
  }
]
