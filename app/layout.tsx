import './globals.css'
import { ReactNode } from 'react'
import { UserContextProvider } from '../context/UserContext'
import HomeButton from '../components/HomeButton'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserContextProvider>
          <HomeButton />
          {children}
        </UserContextProvider>
      </body>
    </html>
  )
}