'use client'

import { useEffect, useState } from 'react'
import { Banknote, Beef, Beer, Clock, CreditCard, Martini, Pizza, Sandwich, Smartphone, Users, type LucideIcon } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { paymentMethods, promos, promosCopy, type Promo } from '@/lib/promos'

const promoIcons: Record<Promo['icon'], LucideIcon> = { sandwich: Sandwich, users: Users, beef: Beef, pizza: Pizza, martini: Martini, beer: Beer }
const paymentIcons = { card: CreditCard, phone: Smartphone, credit: CreditCard }

export function PromosPanel() {
  const { lang } = useLanguage()
  // El día se lee en el navegador (después de montar) para no desajustar el HTML del servidor.
  const [today, setToday] = useState<number | null>(null)
  useEffect(() => setToday(new Date().getDay()), [])

  return (
    <section aria-labelledby="promos-title" className="mb-14">
      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">{promosCopy.eyebrow[lang]}</p>
        <h2 id="promos-title" className="font-heading text-[clamp(1.5rem,6.4vw,1.875rem)] text-heading sm:text-4xl">
          {promosCopy.title[lang]}
        </h2>
      </div>

      {/* Celular: tarjetas en fila que se deslizan; pantallas grandes: grilla. */}
      <ul className="-mx-5 flex scroll-px-5 snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
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
