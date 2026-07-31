import type { Metadata } from 'next'

import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: {
    default: 'VeraTalley',
    template: '%s · VeraTalley',
  },
  description:
    'Verifiable voting. Anyone can confirm a ballot was cast. Nobody can see how anyone voted.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
