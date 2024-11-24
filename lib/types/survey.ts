export interface SurveyData {
  key_goals: string;
  key_risks: string;
  deadline: string;
  budget: number;
}

export interface ProjectPlan {
  tasks: ProjectTask[];
  risks: ProjectRisk[];
  timeline: Timeline;
  budget: BudgetBreakdown;
}

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  dependencies: string[];
  assignedTo: string[];
  estimatedCost: number;
}

interface ProjectRisk {
  id: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation: string;
  contingency: string;
}

interface Timeline {
  startDate: string;
  endDate: string;
  milestones: Array<{
    date: string;
    description: string;
  }>;
}

interface BudgetBreakdown {
  total: number;
  breakdown: Record<string, number>;
  contingency: number;
}

// Add other necessary interfaces... 