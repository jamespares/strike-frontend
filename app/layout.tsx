'use client'

import { UserContextProvider } from '@/context/UserContext'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Project Planner</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-[#1a1f2e]">
        <UserContextProvider>
          {children}
        </UserContextProvider>
      </body>
    </html>
  )
}