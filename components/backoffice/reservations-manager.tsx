'use client'

import { Check, Trash2, Undo2, X } from 'lucide-react'
import { deleteReserva, setReservaEstado } from '@/app/backoffice/reservas-actions'
import { ErrorNote, btnIcon, useRunner } from '@/components/backoffice/ui'
import type { Estado, Reserva } from '@/lib/reservas'
import { cn } from '@/lib/utils'

const ESTILO: Record<Estado, string> = {
  pendiente: 'bg-amber-100 text-amber-900',
  confirmada: 'bg-green-100 text-green-900',
  cancelada: 'bg-gray-200 text-gray-600',
}

const dia = (fecha: string) =>
  new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${fecha}T00:00:00Z`))

export function ReservationsManager({ reservas, hoy }: { reservas: Reserva[]; hoy: string }) {
  const { pending, error, run } = useRunner()
  // Próximas: de la más cercana a la más lejana. Pasadas: las más recientes primero.
  const proximas = reservas.filter((r) => r.fecha >= hoy).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
  const pasadas = reservas.filter((r) => r.fecha < hoy)

  const row = (r: Reserva) => (
    <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3.5">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">
          {r.nombre} <span className="font-normal text-muted-foreground">· {r.personas} {r.personas === 1 ? 'persona' : 'personas'}</span>
        </p>
        <p className="text-sm text-muted-foreground first-letter:uppercase">
          {dia(r.fecha)} · {r.hora} hs
        </p>
      </div>
      <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold capitalize', ESTILO[r.estado])}>{r.estado}</span>
      <div className="flex gap-1.5">
        {r.estado !== 'confirmada' && (
          <button type="button" className={btnIcon} disabled={pending} title="Confirmar" aria-label={`Confirmar la reserva de ${r.nombre}`} onClick={() => run(() => setReservaEstado(r.id, 'confirmada'))}>
            <Check className="h-4 w-4" aria-hidden />
          </button>
        )}
        {r.estado !== 'cancelada' && (
          <button type="button" className={btnIcon} disabled={pending} title="Cancelar" aria-label={`Cancelar la reserva de ${r.nombre}`} onClick={() => run(() => setReservaEstado(r.id, 'cancelada'))}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
        {r.estado !== 'pendiente' && (
          <button type="button" className={btnIcon} disabled={pending} title="Volver a pendiente" aria-label={`Marcar como pendiente la reserva de ${r.nombre}`} onClick={() => run(() => setReservaEstado(r.id, 'pendiente'))}>
            <Undo2 className="h-4 w-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          className={btnIcon}
          disabled={pending}
          title="Eliminar"
          aria-label={`Eliminar la reserva de ${r.nombre}`}
          onClick={() => window.confirm(`¿Eliminar la reserva de ${r.nombre}? No se puede deshacer.`) && run(() => deleteReserva(r.id))}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </li>
  )

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Las reservas llegan desde la web y también te avisan por WhatsApp. Confirmalas o cancelalas desde acá: tus clientes no pueden darlas de baja.
      </p>
      <ErrorNote message={error} />
      <section>
        <h2 className="title-font mb-3 text-xl font-medium text-heading">Próximas ({proximas.length})</h2>
        {proximas.length ? <ul className="space-y-2.5">{proximas.map(row)}</ul> : <p className="text-sm text-muted-foreground">Todavía no hay reservas próximas.</p>}
      </section>
      {pasadas.length > 0 && (
        <section>
          <h2 className="title-font mb-3 text-xl font-medium text-heading">Pasadas ({pasadas.length})</h2>
          <ul className="space-y-2.5 opacity-75">{pasadas.map(row)}</ul>
        </section>
      )}
    </div>
  )
}
