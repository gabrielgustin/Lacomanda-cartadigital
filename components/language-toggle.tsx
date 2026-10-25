'use client'

import { useId } from 'react'
import { useLanguage } from '@/components/language-provider'
import type { Lang } from '@/lib/menu-data'

// Banderas dibujadas en SVG: los emojis de banderas no se ven en Windows.
function Flag({ lang }: { lang: Lang }) {
  const id = useId()
  return (
    <span aria-hidden className="relative block h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
      {lang === 'es' ? (
        // Argentina
        <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          <rect width="3" height="2" fill="#74ACDF" />
          <rect y="0.667" width="3" height="0.667" fill="#fff" />
          <circle cx="1.5" cy="1" r="0.2" fill="#F6B40E" />
        </svg>
      ) : (
        // Reino Unido
        <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          <clipPath id={`${id}-s`}>
            <path d="M0,0 v30 h60 v-30 z" />
          </clipPath>
          <clipPath id={`${id}-t`}>
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
          </clipPath>
          <g clipPath={`url(#${id}-s)`}>
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id}-t)`} stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      )}
    </span>
  )
}

const OPTIONS: { lang: Lang; name: string }[] = [
  { lang: 'es', name: 'Español' },
  { lang: 'en', name: 'English' },
]

// Selector de idioma: dos banderas y una perilla que se desliza a la elegida.
// Español queda por defecto; tocar una opción la elige directamente.
export function LanguageToggle() {
  const { lang, setLang, t } = useLanguage()

  return (
    <div
      role="radiogroup"
      aria-label={t.languageLabel}
      className="absolute right-4 top-4 z-10 flex rounded-pill border border-border bg-card p-0.5 shadow-sm sm:right-6 sm:top-6"
    >
      <span
        aria-hidden
        className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-pill bg-button shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${lang === 'en' ? 'translate-x-full' : ''}`}
      />
      {OPTIONS.map((option) => {
        const active = lang === option.lang
        return (
          <button
            key={option.lang}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.name}
            lang={option.lang}
            onClick={() => setLang(option.lang)}
            title={option.name}
            className={`relative z-10 flex items-center justify-center rounded-pill px-3 py-0.5 transition-opacity duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${active ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
          >
            <Flag lang={option.lang} />
          </button>
        )
      })}
    </div>
  )
}
