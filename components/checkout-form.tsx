'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ShoppingBag } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { useOrder } from '@/components/order-provider'
import { formatPrice } from '@/lib/format'

const CONTACT_KEY = 'la-comanda-contact'

const fieldClass =
  'w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20'
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground'

export function CheckoutForm() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const { ready, lines, total } = useOrder()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // Se recuerda el contacto para la próxima compra.
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CONTACT_KEY) ?? '{}')
      if (typeof saved.name === 'string') setName(saved.name)
      if (typeof saved.phone === 'string') setPhone(saved.phone)
    } catch {}
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (sending) return
    setSending(true)
    setError('')
    try {
      // Solo viajan ids y cantidades: el precio lo calcula el servidor.
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name, phone },
          notes: notes || undefined,
          items: lines.map(({ item, quantity }) => ({ productId: item.id, quantity })),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.token) throw new Error(data.error || t.sendError)
      try {
        window.localStorage.setItem(CONTACT_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim() }))
      } catch {}
      // El carrito se vacía recién en la pantalla de seguimiento, cuando el pedido ya existe.
      router.push(`/pedido/${data.token}?nuevo=1`)
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : t.sendError)
      setSending(false)
    }
  }

  if (!ready) return <div className="h-64 animate-pulse rounded-3xl bg-muted" aria-hidden />

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{t.emptyCheckout}</p>
        <Link
          href="/"
          className="mt-4 inline-flex h-11 items-center rounded-pill bg-button px-5 text-sm font-semibold text-button-foreground transition hover:bg-button/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t.backToMenu}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">{t.takeaway}</p>
        <h1 className="font-heading text-3xl text-heading sm:text-4xl">{t.checkoutTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.checkoutHint}</p>
      </div>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="checkout-data">
        <h2 id="checkout-data" className="font-heading text-lg text-heading">
          {t.yourData}
        </h2>
        <div>
          <label htmlFor="checkout-name" className={labelClass}>
            {t.nameLabel}
          </label>
          <input
            id="checkout-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="checkout-phone" className={labelClass}>
            {t.phoneLabel}
          </label>
          <input
            id="checkout-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            minLength={6}
            maxLength={30}
            pattern="[0-9\s+()\-]+"
            autoComplete="tel"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="checkout-notes" className={labelClass}>
            {t.notesLabel}
          </label>
          <textarea
            id="checkout-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t.notesPlaceholder}
            className={`${fieldClass} resize-none`}
          />
        </div>
        <p className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-foreground">
          <ShoppingBag className="h-4 w-4 text-primary" aria-hidden />
          {t.pickupLabel}
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="checkout-summary">
        <h2 id="checkout-summary" className="font-heading text-lg text-heading">
          {t.summaryTitle}
        </h2>
        <ul className="mt-2 divide-y divide-border/70">
          {lines.map(({ item, quantity }) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3 py-3">
              <p className="font-heading text-sm text-heading">
                <span className="mr-2 tabular-nums text-price">{quantity}×</span>
                {item.name[lang]}
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">{formatPrice(item.price * quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.totalLabel}</span>
          <span className="font-heading text-xl text-price">{formatPrice(total)}</span>
        </p>
      </section>

      {error && (
        <p role="alert" className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-foreground">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-button px-5 text-sm font-semibold text-button-foreground shadow-lg shadow-button/20 transition hover:bg-button/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {sending ? t.sending : t.confirmOrder}
      </button>
    </form>
  )
}
