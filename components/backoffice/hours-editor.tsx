'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { saveHours } from '@/app/backoffice/settings-actions'
import { ErrorNote, Field, Switch, btnIcon, btnOutline, btnPrimary, inputClass, useRunner } from '@/components/backoffice/ui'
import type { Tramo } from '@/lib/settings'

// Se muestra de lunes a domingo, pero cada índice es getDay() (0 = domingo), que es lo que se guarda.
const DAYS = [
  { index: 1, name: 'Lunes' },
  { index: 2, name: 'Martes' },
  { index: 3, name: 'Miércoles' },
  { index: 4, name: 'Jueves' },
  { index: 5, name: 'Viernes' },
  { index: 6, name: 'Sábado' },
  { index: 0, name: 'Domingo' },
]

const DEFAULT_TRAMO: Tramo = { desde: '12:00', hasta: '23:00' }
const SECOND_TRAMO: Tramo = { desde: '18:00', hasta: '23:00' }

export function HoursEditor({ horarios, aceptarFueraDeHorario: initialAceptar }: { horarios: Tramo[][]; aceptarFueraDeHorario: boolean }) {
  const [days, setDays] = useState<Tramo[][]>(horarios)
  const [aceptar, setAceptar] = useState(initialAceptar)
  const [saved, setSaved] = useState(false)
  const { pending, error, run } = useRunner()

  const incomplete = days.some((day) => day.some((tramo) => !tramo.desde || !tramo.hasta))

  const update = (next: Tramo[][]) => {
    setDays(next)
    setSaved(false)
  }

  const setTramo = (dayIndex: number, slot: number, field: keyof Tramo, value: string) =>
    update(days.map((day, i) => (i !== dayIndex ? day : day.map((tramo, s) => (s === slot ? { ...tramo, [field]: value } : tramo)))))

  const toggleOpen = (dayIndex: number, open: boolean) => update(days.map((day, i) => (i !== dayIndex ? day : open ? [{ ...DEFAULT_TRAMO }] : [])))

  const addSecond = (dayIndex: number) => update(days.map((day, i) => (i !== dayIndex ? day : [...day, { ...SECOND_TRAMO }])))

  const removeSecond = (dayIndex: number) => update(days.map((day, i) => (i !== dayIndex ? day : day.slice(0, 1))))

  const changeAceptar = (value: boolean) => {
    setAceptar(value)
    setSaved(false)
  }

  const save = () => run(() => saveHours({ horarios: days, aceptarFueraDeHorario: aceptar }), () => setSaved(true))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-4">
        <div className="min-w-0">
          <p id="aceptar-label" className="text-sm font-semibold text-foreground">
            Aceptar pedidos fuera de horario
          </p>
          <p className="text-xs text-muted-foreground">Si está desactivado, el local no toma pedidos cuando está cerrado.</p>
        </div>
        <Switch checked={aceptar} disabled={pending} label="Aceptar pedidos fuera de horario" onChange={changeAceptar} />
      </div>

      <ul className="space-y-3">
        {DAYS.map(({ index, name }) => {
          const day = days[index]
          const open = day.length > 0
          return (
            <li key={index} className="rounded-3xl border border-border bg-card p-4" aria-labelledby={`dia-${index}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id={`dia-${index}`} className="title-font text-lg text-heading">
                  {name}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{open ? 'Abierto' : 'Cerrado'}</span>
                  <Switch checked={open} disabled={pending} label={`Abierto los ${name.toLowerCase()}`} onChange={(value) => toggleOpen(index, value)} />
                </div>
              </div>

              {open && (
                <div className="mt-4 space-y-3">
                  {day.map((tramo, slot) => (
                    <div key={slot} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <Field label={day.length > 1 ? `Desde (tramo ${slot + 1})` : 'Desde'}>
                        <input
                          type="time"
                          className={inputClass}
                          required
                          value={tramo.desde}
                          disabled={pending}
                          onChange={(event) => setTramo(index, slot, 'desde', event.target.value)}
                        />
                      </Field>
                      <Field label={day.length > 1 ? `Hasta (tramo ${slot + 1})` : 'Hasta'}>
                        <input
                          type="time"
                          className={inputClass}
                          required
                          value={tramo.hasta}
                          disabled={pending}
                          onChange={(event) => setTramo(index, slot, 'hasta', event.target.value)}
                        />
                      </Field>
                      {slot === 1 && (
                        <button
                          type="button"
                          className={btnIcon}
                          aria-label={`Quitar segundo tramo de ${name.toLowerCase()}`}
                          disabled={pending}
                          onClick={() => removeSecond(index)}
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  ))}

                  {day.length < 2 && (
                    <button type="button" className={btnOutline} disabled={pending} onClick={() => addSecond(index)}>
                      + segundo tramo
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-muted-foreground">Si cierra después de medianoche, poné el horario de cierre del día siguiente (ej. 20:00 a 02:00).</p>

      {incomplete && <p className="text-sm text-muted-foreground">Completá todos los horarios antes de guardar.</p>}
      <ErrorNote message={error} />

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saved && (
          <p role="status" className="text-sm font-medium text-foreground">
            Guardado
          </p>
        )}
        <button type="button" className={btnPrimary} disabled={pending || incomplete} onClick={save}>
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
