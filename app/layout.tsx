'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import { UserContextProvider } from '@/context/UserContext'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [supabaseClient] = useState(() => createClientComponentClient())

  return (
    <html lang="en">
      <head>
        <title>Project Planner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-[#1a1f2e]">
        <SessionContextProvider supabaseClient={supabaseClient}>
          <UserContextProvider>
            {children}
          </UserContextProvider>
        </SessionContextProvider>
      </body>
    </html>
  )
}