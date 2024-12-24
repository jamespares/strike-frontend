import { AssetGenerationStatus } from '@/lib/types/assets'

const steps = [
  { status: AssetGenerationStatus.GENERATING_ASSETS, label: 'Project Plan' },
  { status: AssetGenerationStatus.GENERATING_ASSETS, label: 'Timeline' },
  { status: AssetGenerationStatus.GENERATING_ASSETS, label: 'Risks' },
  { status: AssetGenerationStatus.GENERATING_ASSETS, label: 'Roadmap' },
]

export function ProgressBar({ status }: { status: AssetGenerationStatus }) {
  const currentStepIndex = steps.findIndex(step => step.status === status)

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {steps.map((step, index) => (
          <div
            key={step.status}
            className={`flex flex-col items-center w-1/8
              ${index <= currentStepIndex ? 'text-amber-500' : 'text-gray-500'}`}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2
              ${index <= currentStepIndex ? 'border-amber-500' : 'border-gray-500'}`}
            >
              {index < currentStepIndex ? '✓' : index + 1}
            </div>
            <span className="text-sm text-center">{step.label}</span>
          </div>
        ))}
      </div>
      <div className="h-2 bg-gray-700 rounded-full">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
