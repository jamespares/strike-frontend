'use client'

import { useRouter, usePathname } from 'next/navigation'
import { RiHome4Fill } from 'react-icons/ri'
import { Download } from 'lucide-react'
import { Button } from '../ui/button'
import type { ButtonProps } from '../ui/button'

export const HomeButton = () => {
  const router = useRouter()
  const pathname = usePathname()

  if (!pathname.startsWith('/survey')) return null

  return (
    <Button
      variant="default"
      onClick={() => router.push('/')}
      className="fixed top-6 left-6 z-50 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl border border-amber-500/30"
    >
      <RiHome4Fill className="mr-2" />
      Home
    </Button>
  )
}

export const DownloadButton = ({
  format = 'PDF',
  variant = 'default',
  isLoading,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps & {
  format?: string
  isLoading?: boolean
}) => {
  const variantStyles =
    variant === 'default'
      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 border border-amber-500/30'
      : 'bg-transparent border border-amber-500/30 text-amber-500 hover:bg-amber-500/10'

  return (
    <Button
      variant={variant}
      disabled={disabled || isLoading}
      className={`transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${variantStyles} ${className}`}
      {...props}
    >
      <Download className="mr-2 h-4 w-4" />
      {children || `Download ${format}`}
    </Button>
  )
}
