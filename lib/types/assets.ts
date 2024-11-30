export enum AssetGenerationStatus {
  NOT_STARTED = 'NOT_STARTED',
  GENERATING_ASSETS = 'GENERATING_ASSETS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface GenerationProgress {
  status: AssetGenerationStatus;
  error?: string;
} 