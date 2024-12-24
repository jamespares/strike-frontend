import { ButtonHTMLAttributes } from 'react'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DownloadButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
  isLoading?: boolean
}

export function DownloadButton({
  children,
  variant = 'default',
  isLoading,
  disabled,
  className = '',
  ...props
}: DownloadButtonProps) {
  const baseStyles =
    'px-4 py-2 rounded-xl text-sm font-semibold transform hover:scale-105 active:scale-95 transition duration-200 ease-in-out shadow-lg hover:shadow-xl flex items-center gap-2'

  const variantStyles =
    variant === 'default'
      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 border border-amber-500/30'
      : 'bg-transparent border border-amber-500/30 text-amber-500 hover:bg-amber-500/10'

  const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
      {...props}
    >
      <Download className="h-4 w-4" />
      {children}
    </button>
  )
}
