'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ShoppingBag, X } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { useOrder } from '@/components/order-provider'
import { formatPrice } from '@/lib/format'
import { orderTotals, type CouponTerms } from '@/lib/pricing'

interface PaymentMethod {
  id: string
  nombre: string
  predeterminado: boolean
}
type AppliedCoupon = CouponTerms & { codigo: string }

const CONTACT_KEY = 'la-comanda-contact'

const fieldClass =
  'w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20'
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground'

export function CheckoutForm({ canOrder, paymentMethods }: { canOrder: boolean; paymentMethods: PaymentMethod[] }) {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const { ready, lines } = useOrder()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [paymentId, setPaymentId] = useState(
    () => (paymentMethods.find((method) => method.predeterminado) ?? paymentMethods[0])?.id ?? '',
  )
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [checking, setChecking] = useState(false)

  async function applyCoupon() {
    const code = couponInput.trim()
    if (!code || checking) return
    setChecking(true)
    setCouponError('')
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.codigo) {
        setCouponError(response.status === 429 && data.error ? data.error : t.couponInvalid)
      } else {
        setCoupon({ codigo: data.codigo, tipo: data.tipo, valor: data.valor })
        setCouponInput('')
      }
    } catch {
      setCouponError(t.couponInvalid)
    }
    setChecking(false)
  }

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
    if (sending || !canOrder) return
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
          paymentMethodId: paymentMethods.length > 0 ? paymentId : undefined,
          coupon: coupon?.codigo,
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

  const { subtotal, descuento, total } = orderTotals(
    lines.map(({ item, quantity }) => ({ price: item.price, quantity })),
    coupon,
  )

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
      {!canOrder && (
        <div role="alert" className="rounded-2xl border border-border bg-muted px-4 py-3">
          <p className="font-heading text-base text-heading">{t.closedTitle}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t.closedHint}</p>
        </div>
      )}

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
            pattern="[0-9\s+\(\)\-]+"
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

      {paymentMethods.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 id="checkout-payment" className="font-heading text-lg text-heading">
            {t.paymentTitle}
          </h2>
          <div role="radiogroup" aria-labelledby="checkout-payment" className="mt-3 flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className="flex cursor-pointer items-center gap-2 rounded-pill border border-border px-4 py-2 text-sm font-semibold transition has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={paymentId === method.id}
                  onChange={() => setPaymentId(method.id)}
                  className="h-4 w-4 accent-primary"
                />
                {method.nombre}
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <label htmlFor="checkout-coupon" className={labelClass}>
          {t.couponLabel}
        </label>
        {coupon ? (
          <p className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-foreground">
            <span>{t.couponApplied(coupon.codigo)}</span>
            <button
              type="button"
              onClick={() => setCoupon(null)}
              aria-label={t.couponRemove}
              className="flex h-8 w-8 items-center justify-center rounded-pill transition hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </p>
        ) : (
          <div className="flex gap-2">
            <input
              id="checkout-coupon"
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void applyCoupon()
                }
              }}
              placeholder={t.couponPlaceholder}
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={40}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={checking || !couponInput.trim()}
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-pill bg-button px-5 text-sm font-semibold text-button-foreground transition hover:bg-button/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {checking && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t.couponApply}
            </button>
          </div>
        )}
        {couponError && (
          <p role="alert" className="mt-2 text-sm font-semibold text-foreground">
            {couponError}
          </p>
        )}
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
        <div aria-live="polite" className="mt-2 space-y-2 border-t border-border pt-4">
          {descuento > 0 && (
            <>
              <p className="flex items-baseline justify-between text-sm text-muted-foreground">
                <span>{t.subtotalLabel}</span>
                <span>{formatPrice(subtotal)}</span>
              </p>
              <p className="flex items-baseline justify-between text-sm text-muted-foreground">
                <span>
                  {t.discountLabel}
                  {coupon && ` (${coupon.codigo})`}
                </span>
                <span>−{formatPrice(descuento)}</span>
              </p>
            </>
          )}
          <p className="flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.totalLabel}</span>
            <span className="font-heading text-xl text-price">{formatPrice(total)}</span>
          </p>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-foreground">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending || !canOrder}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-button px-5 text-sm font-semibold text-button-foreground shadow-lg shadow-button/20 transition hover:bg-button/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {sending ? t.sending : t.confirmOrder}
      </button>
    </form>
  )
}
