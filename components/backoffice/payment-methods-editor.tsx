'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { savePaymentMethods } from '@/app/backoffice/settings-actions'
import { ErrorNote, Field, Switch, btnIcon, btnOutline, btnPrimary, inputClass, useRunner } from '@/components/backoffice/ui'
import type { MetodoPago } from '@/lib/settings'

const MAX_METHODS = 20 // mismo límite que el servidor (metodosPagoSchema)

/** Deja un único predeterminado, que siempre sea un método activo (o ninguno si no hay activos). */
const normalize = (list: MetodoPago[], preferId?: string): MetodoPago[] => {
  const active = list.filter((method) => method.activo)
  const fallback = active.find((method) => method.id === preferId) ?? active.find((method) => method.predeterminado) ?? active[0]
  return list.map((method) => ({ ...method, predeterminado: method.id === fallback?.id }))
}

export function PaymentMethodsEditor({ initial }: { initial: MetodoPago[] }) {
  const [methods, setMethods] = useState<MetodoPago[]>(() => normalize(initial))
  const [saved, setSaved] = useState(false)
  const { pending, error, setError, run } = useRunner()

  const edit = (change: (list: MetodoPago[]) => MetodoPago[]) => {
    setSaved(false)
    setMethods(change)
  }

  const patch = (id: string, changes: Partial<MetodoPago>) =>
    edit((list) => list.map((method) => (method.id === id ? { ...method, ...changes } : method)))

  const setActive = (id: string, activo: boolean) => edit((list) => normalize(list.map((method) => (method.id === id ? { ...method, activo } : method))))

  const setDefault = (id: string) =>
    edit((list) => normalize(list.map((method) => (method.id === id ? { ...method, activo: true } : method)), id))

  const remove = (id: string) => edit((list) => normalize(list.filter((method) => method.id !== id)))

  const add = () =>
    edit((list) => normalize([...list, { id: crypto.randomUUID().slice(0, 12), nombre: '', activo: true, predeterminado: false }]))

  const save = () => {
    setSaved(false)
    if (methods.some((method) => !method.nombre.trim())) {
      setError('Completá el nombre de todos los medios de pago.')
      return
    }
    run(() => savePaymentMethods(methods), () => setSaved(true))
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Los clientes eligen uno de los medios activos al finalizar el pedido para llevar.</p>
        <button type="button" className={btnOutline} onClick={add} disabled={methods.length >= MAX_METHODS}>
          <Plus className="h-4 w-4" aria-hidden />
          Agregar medio de pago
        </button>
      </div>

      <div className="mb-4">
        <ErrorNote message={error} />
      </div>

      {methods.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Todavía no hay medios de pago. Agregá el primero para que los clientes puedan elegirlo.
        </p>
      ) : (
        <ul className="space-y-3">
          {methods.map((method, index) => {
            const name = method.nombre.trim() || `Medio ${index + 1}`
            return (
              <li key={method.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3 sm:flex-nowrap sm:p-4">
                <Field label="Nombre" className="min-w-0 flex-1">
                  <input
                    className={inputClass}
                    maxLength={40}
                    value={method.nombre}
                    onChange={(event) => patch(method.id, { nombre: event.target.value })}
                  />
                </Field>
                <div className="flex w-full flex-wrap items-center gap-4 sm:w-auto sm:flex-nowrap">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Switch checked={method.activo} disabled={pending} label={`Activo: ${name}`} onChange={(value) => setActive(method.id, value)} />
                    <span aria-hidden>Activo</span>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="metodo-predeterminado"
                      value={method.id}
                      checked={method.predeterminado}
                      disabled={pending}
                      onChange={() => setDefault(method.id)}
                      className="h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    />
                    Predeterminado
                  </label>
                  <button type="button" className={btnIcon} disabled={pending} aria-label={`Quitar ${name}`} onClick={() => remove(method.id)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" className={btnPrimary} disabled={pending} onClick={save}>
          Guardar
        </button>
        {saved && !pending && (
          <p role="status" className="text-sm text-muted-foreground">
            Guardado
          </p>
        )}
      </div>
    </>
  )
}
