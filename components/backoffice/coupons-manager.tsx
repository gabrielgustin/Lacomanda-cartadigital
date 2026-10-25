'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { deleteCoupon, saveCoupon } from '@/app/backoffice/settings-actions'
import { ErrorNote, Field, Switch, btnDanger, btnIcon, btnOutline, btnPrimary, inputClass, useRunner } from '@/components/backoffice/ui'
import { Modal } from '@/components/modal'
import { couponValidOn, type Cupon } from '@/lib/settings'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

type CouponDraft = {
  id?: string
  codigo: string
  tipo: 'porcentaje' | 'fijo'
  valor: string // string mientras se escribe; se convierte al guardar
  desde: string
  hasta: string
  activo: boolean
}

const emptyCoupon: CouponDraft = { codigo: '', tipo: 'porcentaje', valor: '', desde: '', hasta: '', activo: true }

const toDraft = (cupon: Cupon): CouponDraft => ({
  id: cupon.id,
  codigo: cupon.codigo,
  tipo: cupon.tipo,
  valor: String(cupon.valor),
  desde: cupon.desde ?? '',
  hasta: cupon.hasta ?? '',
  activo: cupon.activo,
})

// 'YYYY-MM-DD' -> 'DD/MM/YYYY' para mostrar
const formatDay = (iso: string) => iso.split('-').reverse().join('/')

const discount = (cupon: Cupon) => (cupon.tipo === 'porcentaje' ? `${cupon.valor} %` : formatPrice(cupon.valor))

export function CouponsManager({ initial }: { initial: Cupon[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<CouponDraft | null>(null)
  const [deleting, setDeleting] = useState<Cupon | null>(null)
  // Se calcula después de montar para no desincronizar el HTML del servidor (hidratación).
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])

  // Vencido = tiene fecha de fin y ya pasó. Ignora `desde` y `activo` a propósito.
  const isExpired = (cupon: Cupon) => now !== null && cupon.hasta !== null && !couponValidOn({ ...cupon, activo: true, desde: null }, now)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Los cupones se aplican al pedido para llevar. Un cupón inactivo o vencido no se puede usar.</p>
        <button type="button" className={btnPrimary} onClick={() => setEditing(emptyCoupon)}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo cupón
        </button>
      </div>

      {initial.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Todavía no creaste cupones.</p>
      ) : (
        <ul className="space-y-3">
          {initial.map((cupon) => {
            const expired = isExpired(cupon)
            return (
              <li key={cupon.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 sm:flex-nowrap sm:p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="title-font text-base text-heading">{cupon.codigo}</span>
                    <span className="text-sm text-muted-foreground">{discount(cupon)}</span>
                    {!cupon.activo && <span className="rounded-pill border border-border px-2 py-0.5 text-xs text-muted-foreground">Inactivo</span>}
                    {expired && <span className="rounded-pill border border-border px-2 py-0.5 text-xs text-muted-foreground">Vencido</span>}
                  </p>
                  {(cupon.desde || cupon.hasta) && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {cupon.desde ? `Desde ${formatDay(cupon.desde)}` : 'Sin inicio'}
                      {' · '}
                      {cupon.hasta ? `Hasta ${formatDay(cupon.hasta)}` : 'Sin fin'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className={btnIcon} aria-label={`Editar cupón ${cupon.codigo}`} onClick={() => setEditing(toDraft(cupon))}>
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" className={btnIcon} aria-label={`Eliminar cupón ${cupon.codigo}`} onClick={() => setDeleting(cupon)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && <CouponDialog initial={editing} onClose={() => setEditing(null)} onSaved={() => router.refresh()} />}
      {deleting && <DeleteDialog coupon={deleting} onClose={() => setDeleting(null)} onDeleted={() => router.refresh()} />}
    </>
  )
}

function CouponDialog({ initial, onClose, onSaved }: { initial: CouponDraft; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState(initial)
  const { pending, error, run } = useRunner()
  const isNew = !initial.id
  const isPercent = draft.tipo === 'porcentaje'

  return (
    <Modal labelledBy="coupon-dialog-title" onClose={onClose} className="max-w-lg rounded-lg">
      {(close) => (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const payload = {
              id: draft.id,
              codigo: draft.codigo,
              tipo: draft.tipo,
              valor: Number(draft.valor),
              desde: draft.desde || null,
              hasta: draft.hasta || null,
              activo: draft.activo,
            }
            run(() => saveCoupon(payload), () => {
              close()
              onSaved()
            })
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border p-5">
            <h2 id="coupon-dialog-title" className="text-xl">
              {isNew ? 'Nuevo cupón' : 'Editar cupón'}
            </h2>
            <button type="button" onClick={close} aria-label="Cerrar" className={btnIcon}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-5 p-5">
            <Field label="Código" hint="Solo letras, números, guion bajo y guion. Sin espacios.">
              <input
                data-autofocus={isNew || undefined}
                className={cn(inputClass, 'title-font uppercase')}
                required
                maxLength={30}
                autoCapitalize="characters"
                spellCheck={false}
                value={draft.codigo}
                onChange={(event) => setDraft((current) => ({ ...current, codigo: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo">
                <select
                  className={inputClass}
                  value={draft.tipo}
                  onChange={(event) => setDraft((current) => ({ ...current, tipo: event.target.value as CouponDraft['tipo'] }))}
                >
                  <option value="porcentaje">Porcentaje</option>
                  <option value="fijo">Monto fijo</option>
                </select>
              </Field>
              <Field label={isPercent ? 'Porcentaje de descuento' : 'Monto de descuento'} hint={isPercent ? 'De 1 a 100.' : 'En pesos.'}>
                <input
                  type="number"
                  className={inputClass}
                  required
                  min={1}
                  max={isPercent ? 100 : undefined}
                  step={isPercent ? 1 : 'any'}
                  value={draft.valor}
                  onChange={(event) => setDraft((current) => ({ ...current, valor: event.target.value }))}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Desde" hint="Opcional.">
                <input type="date" className={inputClass} value={draft.desde} onChange={(event) => setDraft((current) => ({ ...current, desde: event.target.value }))} />
              </Field>
              <Field label="Hasta" hint="Opcional.">
                <input type="date" className={inputClass} value={draft.hasta} onChange={(event) => setDraft((current) => ({ ...current, hasta: event.target.value }))} />
              </Field>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <span>
                <span className="block font-semibold">Activo</span>
                <span className="text-xs text-muted-foreground">Si lo desactivás, nadie puede usarlo.</span>
              </span>
              <Switch checked={draft.activo} label="Cupón activo" onChange={(value) => setDraft((current) => ({ ...current, activo: value }))} />
            </label>

            <ErrorNote message={error} />
          </div>

          <div className="flex justify-end gap-3 border-t border-border p-5">
            <button type="button" className={btnOutline} onClick={close}>
              Cancelar
            </button>
            <button type="submit" className={btnPrimary} disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function DeleteDialog({ coupon, onClose, onDeleted }: { coupon: Cupon; onClose: () => void; onDeleted: () => void }) {
  const { pending, error, run } = useRunner()

  return (
    <Modal labelledBy="delete-coupon-title" onClose={onClose} className="rounded-lg">
      {(close) => (
        <div className="space-y-4 p-6">
          <h2 id="delete-coupon-title" className="text-xl">
            ¿Eliminar el cupón “{coupon.codigo}”?
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">Esta acción no se puede deshacer. Si solo querés que no se pueda usar, desactivalo en su lugar.</p>
          <ErrorNote message={error} />
          <div className="flex justify-end gap-3">
            <button type="button" data-autofocus className={btnOutline} onClick={close}>
              Cancelar
            </button>
            <button
              type="button"
              className={btnDanger}
              disabled={pending}
              onClick={() =>
                run(() => deleteCoupon(coupon.id), () => {
                  close()
                  onDeleted()
                })
              }
            >
              {pending ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
