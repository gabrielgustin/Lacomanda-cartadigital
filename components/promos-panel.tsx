'use client'

import { useEffect, useRef, useState } from 'react'
import { Banknote, Beef, Beer, ChevronRight, Clock, CreditCard, Martini, Pizza, Sandwich, Smartphone, Users, type LucideIcon } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { paymentMethods, promos, promosCopy, type Promo } from '@/lib/promos'

const promoIcons: Record<Promo['icon'], LucideIcon> = { sandwich: Sandwich, users: Users, beef: Beef, pizza: Pizza, martini: Martini, beer: Beer }
const paymentIcons = { card: CreditCard, phone: Smartphone, credit: CreditCard }

export function PromosPanel() {
  const { lang } = useLanguage()
  // El día se lee en el navegador (después de montar) para no desajustar el HTML del servidor.
  const [today, setToday] = useState<number | null>(null)
  useEffect(() => setToday(new Date().getDay()), [])

  // Celular: una pista que desaparece apenas se desliza, un degradé en el borde y un empujoncito inicial.
  const listRef = useRef<HTMLUListElement>(null)
  const [atEnd, setAtEnd] = useState(false)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    const list = listRef.current
    if (!list || list.scrollWidth <= list.clientWidth || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(() => {
      list.scrollTo({ left: 56, behavior: 'smooth' })
      setTimeout(() => list.scrollTo({ left: 0, behavior: 'smooth' }), 700)
    }, 900)
    return () => clearTimeout(timer)
  }, [])
  const onScroll = () => {
    const list = listRef.current
    if (!list) return
    if (list.scrollLeft > 80) setTouched(true)
    setAtEnd(list.scrollLeft + list.clientWidth >= list.scrollWidth - 8)
  }
  const next = () => listRef.current?.scrollBy({ left: 272, behavior: 'smooth' })

  return (
    <section aria-labelledby="promos-title" className="mb-14">
      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">{promosCopy.eyebrow[lang]}</p>
        <h2 id="promos-title" className="font-heading text-[clamp(1.5rem,6.4vw,1.875rem)] text-heading sm:text-4xl">
          {promosCopy.title[lang]}
        </h2>
      </div>

      {/* Celular: tarjetas en fila que se deslizan; pantallas grandes: grilla. */}
      <div className="relative">
      <ul
        ref={listRef}
        onScroll={onScroll}
        className="-mx-5 flex scroll-px-5 snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {promos.map((promo) => {
          const Icon = promoIcons[promo.icon]
          const isToday = today !== null && promo.days.includes(today)
          return (
            <li
              key={promo.id}
              className={`flex w-64 shrink-0 snap-start flex-col gap-2 rounded-xl border bg-card p-4 sm:w-auto ${isToday ? 'border-primary ring-1 ring-primary/40' : 'border-border'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-heading text-sm text-heading">
                  <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-muted text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  {promo.day[lang]}
                </span>
                {isToday && (
                  <span className="rounded-pill bg-button px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-button-foreground">{promosCopy.today[lang]}</span>
                )}
              </div>
              {promo.hours && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {promo.hours[lang]}
                </p>
              )}
              <p className="text-sm leading-6 text-muted-foreground">{promo.text[lang]}</p>
            </li>
          )
        })}
      </ul>
      {!atEnd && (
        <>
          <div aria-hidden className="pointer-events-none absolute -right-5 top-0 h-[calc(100%-0.5rem)] w-14 bg-gradient-to-l from-background to-transparent sm:hidden" />
          <button
            type="button"
            onClick={next}
            aria-label={promosCopy.next[lang]}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-pill bg-button text-button-foreground shadow-md transition hover:bg-button/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      )}
      </div>
      {!touched && (
        <p className="mt-1 flex items-center justify-center gap-1 text-xs font-semibold text-primary sm:hidden">
          {promosCopy.swipe[lang]}
          <ChevronRight className="h-3.5 w-3.5 motion-safe:animate-pulse" aria-hidden />
        </p>
      )}

      <div className="mt-4 space-y-4 rounded-xl border border-border bg-muted/40 p-4">
        <p className="flex items-start gap-2.5 text-sm leading-6 text-foreground">
          <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          {promosCopy.cashOnly[lang]}
        </p>
        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">{promosCopy.paymentsTitle[lang]}</h3>
          <ul className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => {
              const Icon = paymentIcons[method.icon]
              return (
                <li key={method.id} className="flex items-center gap-2 rounded-pill border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {method.label[lang]}
                  {method.note && <span className="text-price">{promosCopy.surcharge[lang]}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
