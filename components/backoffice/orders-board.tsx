'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ExternalLink, MessageCircle, RefreshCw } from 'lucide-react'
import { ErrorNote, btnDanger, btnOutline } from '@/components/backoffice/ui'
import { Modal } from '@/components/modal'
import { formatOrderDate, formatPrice } from '@/lib/format'
import { ORDER_STATES, STATE_LABELS, orderNumber, type OrderState } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { waLink } from '@/lib/whatsapp'
import type { Order } from '@/lib/orders'

const ACTIVE: string[] = ['nuevo', 'confirmado', 'preparando', 'listo']

const FILTERS = [
  { key: 'curso', label: 'En curso', match: (o: Order) => ACTIVE.includes(o.estado), empty: 'No hay pedidos en curso. Cuando un cliente haga un pedido para llevar, aparece acá.' },
  { key: 'todos', label: 'Todos', match: () => true, empty: 'Todavía no hay pedidos.' },
  { key: 'entregados', label: 'Entregados', match: (o: Order) => o.estado === 'entregado', empty: 'No hay pedidos entregados.' },
  { key: 'cancelados', label: 'Cancelados', match: (o: Order) => o.estado === 'cancelado', empty: 'No hay pedidos cancelados.' },
] as const

const chipClass: Record<string, string> = {
  nuevo: 'bg-button text-button-foreground',
  confirmado: 'bg-card text-heading border border-heading',
  preparando: 'bg-card text-price border border-price',
  listo: 'bg-heading text-background',
  entregado: 'bg-muted text-heading',
  cancelado: 'border border-dashed border-border text-eyebrow opacity-70',
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
const units = (o: Order) => o.items.reduce((sum, item) => sum + item.cantidad, 0)

async function patchState(id: number, estado: string): Promise<{ order?: Order; error?: string }> {
  try {
    const res = await fetch(`/api/backoffice/pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) return { error: data?.error ?? 'No se pudo cambiar el estado. Probá de nuevo.' }
    return { order: data as Order }
  } catch {
    return { error: 'No se pudo cambiar el estado. Probá de nuevo.' }
  }
}

export function OrdersBoard({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('curso')
  const [loading, setLoading] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/backoffice/pedidos', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      setOrders(await res.json())
      setRefreshError(null)
    } catch {
      setRefreshError('No se pudo actualizar la lista. Probá de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const tick = () => document.visibilityState === 'visible' && refresh()
    const timer = window.setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [refresh])

  const replace = (order: Order) => setOrders((current) => current.map((o) => (o.id === order.id ? order : o)))
  const active = FILTERS.find((f) => f.key === filter)!
  const visible = orders.filter(active.match)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-pill border px-4 py-2 text-sm font-semibold transition',
                focusRing,
                filter === f.key ? 'border-transparent bg-button text-button-foreground' : 'border-border bg-card text-heading hover:border-heading',
              )}
            >
              {f.label} ({orders.filter(f.match).length})
            </button>
          ))}
        </div>
        <button type="button" className={btnOutline} onClick={refresh} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden />
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>
      <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-eyebrow">Últimos 200 pedidos</p>
      <p className="sr-only" aria-live="polite">
        {active.label}: {visible.length === 1 ? '1 pedido' : `${visible.length} pedidos`}
      </p>
      <div className="mb-4">
        <ErrorNote message={refreshError} />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-eyebrow">{active.empty}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => (
            <OrderRow key={order.id} order={order} onChange={replace} />
          ))}
        </ul>
      )}
    </>
  )
}

function OrderRow({ order, onChange }: { order: Order; onChange: (order: Order) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const num = orderNumber(order.id)
  const panelId = `pedido-${order.id}`
  const wa = waLink(order.clienteTelefono, `Hola ${order.clienteNombre}, te escribimos de La Comanda por tu pedido ${num}.`)
  const count = units(order)

  const apply = async (estado: string) => {
    setSaving(true)
    const { order: updated, error: err } = await patchState(order.id, estado)
    setSaving(false)
    setError(err ?? null)
    if (updated) onChange(updated)
    return !err
  }

  return (
    <li className="rounded-3xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn('flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl p-4 text-left sm:p-5', focusRing)}
      >
        <span className="title-font text-lg text-heading">{num}</span>
        <span className={cn('rounded-pill px-3 py-1 text-[10px] uppercase tracking-[0.25em]', chipClass[order.estado])}>
          {STATE_LABELS[order.estado as OrderState]?.es ?? order.estado}
        </span>
        <span className="text-xs text-eyebrow">{formatOrderDate(order.createdAt)}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-heading">
          {order.clienteNombre} · {count === 1 ? '1 unidad' : `${count} unidades`}
        </span>
        <span className="font-semibold text-price">{formatPrice(order.total)}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div id={panelId} className="space-y-4 border-t border-border p-4 text-sm sm:p-5">
          <div>
            <p className="text-heading">{order.clienteNombre}</p>
            <p className="text-eyebrow">{order.clienteTelefono}</p>
          </div>
          {order.notas && (
            <p className="rounded-3xl bg-muted px-4 py-3 text-heading">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-eyebrow">Comentarios</span>
              {order.notas}
            </p>
          )}
          <ul className="space-y-1">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3">
                <span className="text-heading">
                  {item.cantidad} × {item.nombre.es}
                </span>
                <span className="text-price">{formatPrice(item.precioUnitario * item.cantidad)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-border pt-3">
            <div className="flex justify-between">
              <dt className="text-eyebrow">Subtotal</dt>
              <dd className="text-heading">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.descuento > 0 && (
              <div className="flex justify-between">
                <dt className="text-eyebrow">Descuento{order.cupon ? ` (${order.cupon})` : ''}</dt>
                <dd className="text-heading">−{formatPrice(order.descuento)}</dd>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <dt className="text-heading">Total</dt>
              <dd className="text-price">{formatPrice(order.total)}</dd>
            </div>
            {order.metodoPago && (
              <div className="flex justify-between">
                <dt className="text-eyebrow">Medio de pago</dt>
                <dd className="text-heading">{order.metodoPago}</dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap items-end gap-3">
            <label className="block space-y-1">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-eyebrow">Estado</span>
              <select
                value={order.estado}
                disabled={saving}
                onChange={(event) => (event.target.value === 'cancelado' ? setConfirmCancel(true) : apply(event.target.value))}
                className="h-10 rounded-md border border-border bg-card px-3 text-sm text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
              >
                {ORDER_STATES.map((s) => (
                  <option key={s} value={s}>
                    {STATE_LABELS[s].es}
                  </option>
                ))}
              </select>
            </label>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={btnOutline}>
                <MessageCircle className="h-4 w-4" aria-hidden />
                Escribir al cliente
              </a>
            )}
            <a href={`/pedido/${order.token}`} target="_blank" rel="noopener noreferrer" className={btnOutline}>
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ver como cliente
            </a>
          </div>
          <ErrorNote message={error} />
        </div>
      )}

      {confirmCancel && (
        <CancelDialog
          num={num}
          onClose={() => setConfirmCancel(false)}
          onConfirm={async () => {
            const ok = await apply('cancelado')
            return ok
          }}
          error={error}
          saving={saving}
        />
      )}
    </li>
  )
}

function CancelDialog({ num, onClose, onConfirm, error, saving }: { num: string; onClose: () => void; onConfirm: () => Promise<boolean>; error: string | null; saving: boolean }) {
  return (
    <Modal labelledBy="cancel-order-title" onClose={onClose} className="rounded-3xl">
      {(close) => (
        <div className="space-y-4 p-6">
          <h2 id="cancel-order-title" className="title-font text-xl text-heading">
            ¿Cancelar el pedido {num}?
          </h2>
          <p className="text-sm leading-6 text-eyebrow">El cliente va a ver el pedido como cancelado.</p>
          <ErrorNote message={error} />
          <div className="flex justify-end gap-3">
            <button type="button" data-autofocus className={btnOutline} onClick={close}>
              Volver
            </button>
            <button type="button" className={btnDanger} disabled={saving} onClick={async () => (await onConfirm()) && close()}>
              {saving ? 'Cancelando…' : 'Cancelar pedido'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
