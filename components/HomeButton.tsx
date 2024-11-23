'use client'

import { useRouter, usePathname } from 'next/navigation'
import { RiHome4Fill } from 'react-icons/ri'

export default function HomeButton() {
  const router = useRouter()
  const pathname = usePathname()

  // Only show on survey pages
  if (!pathname.startsWith('/survey')) {
    return null
  }

  return (
    <button
      onClick={() => router.push('/')}
      className="fixed top-6 left-6 px-4 py-2 
                bg-gradient-to-r from-amber-600 to-amber-700
                text-white rounded-xl text-sm font-semibold
                hover:from-amber-700 hover:to-amber-800
                transform hover:scale-105 active:scale-95
                transition duration-200 ease-in-out
                shadow-lg hover:shadow-xl
                border border-amber-500/30
                z-50
                flex items-center gap-2"
    >
      <RiHome4Fill className="text-lg" />
      <span>Home</span>
    </button>
  )
} 