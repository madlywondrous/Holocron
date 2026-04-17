import type { Metadata } from 'next'
import { Tomorrow } from 'next/font/google'
import { ErrorBoundary } from '@/components/chat/ErrorBoundary'
import { MainLayout } from '@/components/chat/MainLayout'
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
    <html lang="en">
      <body className={tomorrow.className}>
        <ErrorBoundary>
          <MainLayout>{children}</MainLayout>
        </ErrorBoundary>
      </body>
    </html>
  )
}
