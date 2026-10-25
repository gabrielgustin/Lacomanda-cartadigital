'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSiteTheme } from '@/components/site-theme'
import { strings, type Strings } from '@/lib/i18n'
import type { Lang } from '@/lib/menu-data'

const STORAGE_KEY = 'la-comanda-lang'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Strings
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { texts } = useSiteTheme()
  // Siempre arranca en español (también en el servidor). Solo se pasa a inglés si el cliente
  // lo eligió con el interruptor; esa elección se aplica después de hidratar para no desfasar el HTML.
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(STORAGE_KEY)
    } catch {}
    if (stored === 'es' || stored === 'en') setLangState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }, [])

  // Los textos que el dueño cambió desde el backoffice pisan a los originales.
  const value = useMemo(() => {
    const overrides = Object.fromEntries(Object.entries(texts).flatMap(([key, entry]) => (entry?.[lang] ? [[key, entry[lang]]] : [])))
    return { lang, setLang, t: { ...strings[lang], ...overrides } }
  }, [lang, setLang, texts])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage debe usarse dentro de LanguageProvider')
  return context
}
