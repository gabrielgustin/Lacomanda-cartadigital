import { Analytics } from '@vercel/analytics/next'
import { Bevan, DM_Sans } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { connection } from 'next/server'
import { withBase } from '@/lib/base-path'
import { getStore } from '@/lib/store'
import { DEFAULT_FAVICON_URL, DEFAULT_LOGO_URL, DEFAULT_SITE_DESCRIPTION, DEFAULT_SITE_NAME } from '@/lib/theme'
import './globals.css'

const bevan = Bevan({ subsets: ['latin'], weight: '400', variable: '--font-bevan' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })

const DEFAULT_SHARE_IMAGE = DEFAULT_LOGO_URL

// Título, descripción, ícono e imagen para compartir salen de "Personaliza tu App".
export async function generateMetadata(): Promise<Metadata> {
  await connection()
  const { theme, siteUrl } = await getStore()
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'localhost:3000'
  const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const siteName = theme.siteName ?? DEFAULT_SITE_NAME
  const title = `${siteName} | Carta digital`
  const description = theme.siteDescription ?? DEFAULT_SITE_DESCRIPTION
  const favicon = withBase(theme.faviconUrl ?? DEFAULT_FAVICON_URL)
  const shareImage = withBase(theme.shareImageUrl ?? DEFAULT_SHARE_IMAGE)

  return {
    // Las imágenes subidas son rutas relativas: necesitan una base para volverse absolutas al compartir.
    metadataBase: new URL(siteUrl ?? `${protocol}://${host}`),
    title,
    description,
    generator: 'v0.app',
    icons: { icon: [{ url: favicon }], apple: favicon },
    openGraph: { title, description, type: 'website', locale: 'es_AR', siteName, images: [{ url: shareImage, alt: siteName }] },
    twitter: { card: 'summary', title, description, images: [shareImage] },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`bg-background ${bevan.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
