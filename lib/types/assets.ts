export enum AssetGenerationStatus {
  NOT_STARTED = 'NOT_STARTED',
  GENERATING_PLAN = 'GENERATING_PLAN',
  GENERATING_ROADMAP = 'GENERATING_ROADMAP',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface GenerationProgress {
  status: AssetGenerationStatus;
  error?: string;
} 