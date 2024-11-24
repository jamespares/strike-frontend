export enum AssetGenerationStatus {
  PENDING = 'pending',
  GENERATING_PLAN = 'generating_plan',
  GENERATING_GANTT = 'generating_gantt',
  GENERATING_GANTT_CSV = 'generating_gantt_csv',
  GENERATING_BUDGET = 'generating_budget',
  GENERATING_BUDGET_CSV = 'generating_budget_csv',
  GENERATING_RISK = 'generating_risk',
  GENERATING_RISK_CSV = 'generating_risk_csv',
  GENERATING_ROADMAP = 'generating_roadmap',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface AssetGenerationError {
  step: AssetGenerationStatus;
  message: string;
  timestamp: string;
} 