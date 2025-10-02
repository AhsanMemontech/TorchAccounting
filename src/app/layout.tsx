import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { ChatbotProvider } from '@/components/ChatbotContext'
import { ThemeProvider } from '@/components/ThemeContext'
import './waiting-list.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Torch Accouning',
  description: 'Torch Accouning',
  keywords: '',
}

// 👇 Move this outside `metadata`
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const themeCookie = cookies().get('theme')?.value
  const initialTheme = themeCookie === 'light' || themeCookie === 'dark'
    ? themeCookie
    : 'light'  

  return (
    <html lang="en" data-theme={initialTheme} suppressHydrationWarning>
      <body className={inter.className + ' flex flex-col min-h-screen'}>
        <ThemeProvider serverTheme={initialTheme}>
          <ChatbotProvider>
            {/* <Header /> */}
            <main className="flex-1" >
              {children} 
            </main>
            {/* <Footer /> */}
            {/* <ChatbotWidget /> */}
          </ChatbotProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 