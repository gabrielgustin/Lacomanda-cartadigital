'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { useOrder } from '@/components/order-provider'
import { formatPrice } from '@/lib/format'
import type { PublicOrder } from '@/lib/orders'
import { PROGRESS_STEPS, STATE_LABELS, orderNumber } from '@/lib/pricing'

const POLL_MS = 20_000

export function OrderTracking({ token, initial, isNew }: { token: string; initial: PublicOrder; isNew: boolean }) {
  const { lang, t } = useLanguage()
  const { ready, clear } = useOrder()
  const [order, setOrder] = useState(initial)

  // El pedido ya existe: recién ahora se vacía el carrito. Hay que esperar a `ready`,
  // si no la lectura del carrito guardado lo vuelve a llenar después de vaciarlo.
  useEffect(() => {
    if (isNew && ready) clear()
  }, [isNew, ready, clear])

  // Estado en vivo: se consulta cada tanto, solo con la pestaña visible.
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const response = await fetch(`/api/orders/${token}`, { cache: 'no-store' })
        if (response.ok) setOrder(await response.json())
      } catch {}
    }
    const timer = window.setInterval(refresh, POLL_MS)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [token])

  const cancelled = order.estado === 'cancelado'
  const currentIndex = PROGRESS_STEPS.indexOf(order.estado as (typeof PROGRESS_STEPS)[number])
  // Fecha en zona horaria fija y 24 h: igual en servidor y cliente, sin errores de hidratación.
  const placedAt = new Date(order.createdAt).toLocaleString(lang === 'en' ? 'en-GB' : 'es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: false,
  })

  return (
    <div className="space-y-6">
      <div>
        {isNew && <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">{t.orderNumber(orderNumber(order.id))}</p>}
        <h1 className="font-heading text-3xl text-heading sm:text-4xl">{isNew ? t.received : t.orderNumber(orderNumber(order.id))}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.trackingHint}</p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="tracking-status">
        <h2 id="tracking-status" className="font-heading text-lg text-heading">
          {t.orderStatus}
        </h2>
        {cancelled ? (
          <p role="status" className="mt-3 rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-foreground">
            {t.cancelledTitle}
          </p>
        ) : (
          <ol className="mt-4 space-y-3" aria-live="polite">
            {PROGRESS_STEPS.map((step, index) => {
              const done = index < currentIndex
              const current = index === currentIndex
              return (
                <li key={step} aria-current={current ? 'step' : undefined} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border text-xs font-semibold ${
                      done || current ? 'border-transparent bg-button text-button-foreground' : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                  </span>
                  <span className={`text-sm ${current ? 'font-semibold text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {STATE_LABELS[step][lang]}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="tracking-details">
        <h2 id="tracking-details" className="font-heading text-lg text-heading">
          {t.detailsTitle}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {order.clienteNombre} · {t.pickupLabel} · {placedAt}
        </p>
        <ul className="mt-2 divide-y divide-border/70">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-baseline justify-between gap-3 py-3">
              <p className="font-heading text-sm text-heading">
                <span className="mr-2 tabular-nums text-price">{item.cantidad}×</span>
                {item.nombre[lang]}
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">{formatPrice(item.precioUnitario * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.totalLabel}</span>
          <span className="font-heading text-xl text-price">{formatPrice(order.total)}</span>
        </p>
        {order.notas && (
          <div className="mt-4 rounded-2xl bg-muted px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">{t.commentsTitle}</p>
            <p className="mt-1 text-sm text-foreground">{order.notas}</p>
          </div>
        )}
      </section>
    </div>
  )
}
