import type { Metadata } from 'next'
import { Tomorrow } from 'next/font/google'
import { ErrorBoundary } from '@/components/chat/ErrorBoundary'
import { MainLayout } from '@/components/chat/MainLayout'
import { ThemeProvider } from '@/components/providers'
import 'highlight.js/styles/github-dark.css'
import './globals.css'

const tomorrow = Tomorrow({
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Holocron',
  description: 'Lightweight Gemini chat with local sessions and streaming responses.',
  icons: {
    icon: '/holocron-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={tomorrow.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <MainLayout>{children}</MainLayout>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
