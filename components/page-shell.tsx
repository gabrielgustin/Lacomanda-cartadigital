'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LanguageToggle } from '@/components/language-toggle'
import { useLanguage } from '@/components/language-provider'
import { useSiteTheme } from '@/components/site-theme'
import { DEFAULT_LOGO_URL } from '@/lib/theme'

// Marco de las pantallas del pedido para llevar: mismo encabezado con patrón y logo que la carta, en versión compacta.
export function PageShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()
  const theme = useSiteTheme()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="hero-pattern relative border-b border-border bg-hero">
        {theme.showLanguage && <LanguageToggle />}
        <div className="mx-auto flex max-w-2xl flex-col items-center px-5 pb-5 pt-4 sm:pt-6">
          <Image
            src={theme.logoUrl ?? DEFAULT_LOGO_URL}
            alt={t.logoAlt}
            width={160}
            height={160}
            priority
            className={`h-24 w-24 rounded-logo ${theme.logoFit === 'contain' ? 'object-contain' : 'object-cover'}`}
          />
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-6 sm:pt-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.backToMenu}
        </Link>
        {children}
      </div>
    </main>
  )
}
