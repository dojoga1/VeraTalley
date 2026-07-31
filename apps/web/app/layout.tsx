import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'VeraTalley',
    template: '%s · VeraTalley',
  },
  description:
    'Verifiable voting. Anyone can confirm a ballot was cast. Nobody can see how anyone voted.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}

