import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { AppNav } from '@/components/app-nav'
import './globals.css'
import { ExportReminder } from '@/components/export-reminder'
import { LayoutShell } from '@/components/layout-shell'

const _inter = Inter({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Recipebook',
  description: 'Your personal recipe collection with macro tracking',
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#c2713a',
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'overlays-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
          <AppNav />
           <LayoutShell>{children}</LayoutShell>
        <Toaster position="top-center" richColors duration={2000} />
        <ExportReminder />
        <Analytics />
      </body>
    </html>
  )
}
