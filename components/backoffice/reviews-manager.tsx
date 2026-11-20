'use client'

import { useState } from 'react'
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { deleteResena, saveResena } from '@/app/backoffice/reservas-actions'
import { ErrorNote, Field, Switch, btnOutline, btnPrimary, inputClass, useRunner } from '@/components/backoffice/ui'
import type { Resena } from '@/lib/resenas'

type Draft = { id: number | null; autor: string; texto: string; estrellas: number | null; visible: boolean }
const vacia: Draft = { id: null, autor: '', texto: '', estrellas: 5, visible: true }

export function ReviewsManager({ resenas }: { resenas: Resena[] }) {
  const { pending, error, run } = useRunner()
  const [draft, setDraft] = useState<Draft | null>(null)

  const guardar = () => draft && run(() => saveResena(draft.id, { autor: draft.autor, texto: draft.texto, estrellas: draft.estrellas, visible: draft.visible }), () => setDraft(null))

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Estas reseñas son las que se muestran en la web del local. Agregá, editá, ocultá o eliminá las que quieras: se actualizan solas en la web en unos minutos.
      </p>
      <ErrorNote message={error} />

      {draft ? (
        <form
          className="space-y-4 rounded-xl border border-border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault()
            guardar()
          }}
        >
          <Field label="Nombre de quien opinó">
            <input className={inputClass} value={draft.autor} maxLength={60} onChange={(e) => setDraft({ ...draft, autor: e.target.value })} />
          </Field>
          <Field label="Reseña" hint={`${draft.texto.length}/600`}>
            <textarea className={`${inputClass} h-32 py-2.5`} value={draft.texto} maxLength={600} onChange={(e) => setDraft({ ...draft, texto: e.target.value })} />
          </Field>
          <Field label="Estrellas" hint="Si no querés mostrar estrellas, elegí «Sin estrellas».">
            <select className={inputClass} value={draft.estrellas ?? ''} onChange={(e) => setDraft({ ...draft, estrellas: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Sin estrellas</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'estrella' : 'estrellas'}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-center gap-3">
            <Switch checked={draft.visible} onChange={(visible) => setDraft({ ...draft, visible })} label="Mostrar en la web" />
            <span className="text-sm text-foreground">Mostrar en la web</span>
          </div>
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary} disabled={pending}>
              Guardar
            </button>
            <button type="button" className={btnOutline} disabled={pending} onClick={() => setDraft(null)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={btnPrimary} onClick={() => setDraft(vacia)}>
          <Plus className="h-4 w-4" aria-hidden /> Agregar reseña
        </button>
      )}

      <ul className="space-y-2.5">
        {resenas.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-3.5">
            <div className={`min-w-0 flex-1 ${r.visible ? '' : 'opacity-50'}`}>
              <p className="flex items-center gap-2 font-medium text-foreground">
                {r.autor}
                {r.estrellas && (
                  <span className="inline-flex items-center gap-0.5 text-sm text-amber-600">
                    {r.estrellas}
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                  </span>
                )}
                {!r.visible && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Oculta</span>}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{r.texto}</p>
            </div>
            <div className="flex gap-1.5">
              <button type="button" title="Editar" aria-label={`Editar la reseña de ${r.autor}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card hover:border-primary" onClick={() => setDraft({ id: r.id, autor: r.autor, texto: r.texto, estrellas: r.estrellas, visible: r.visible })}>
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" title={r.visible ? 'Ocultar' : 'Mostrar'} aria-label={`${r.visible ? 'Ocultar' : 'Mostrar'} la reseña de ${r.autor}`} disabled={pending} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card hover:border-primary disabled:opacity-40" onClick={() => run(() => saveResena(r.id, { autor: r.autor, texto: r.texto, estrellas: r.estrellas, visible: !r.visible }))}>
                {r.visible ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
              </button>
              <button type="button" title="Eliminar" aria-label={`Eliminar la reseña de ${r.autor}`} disabled={pending} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card hover:border-red-600 hover:text-red-700 disabled:opacity-40" onClick={() => window.confirm(`¿Eliminar la reseña de ${r.autor}? No se puede deshacer.`) && run(() => deleteResena(r.id))}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
        {resenas.length === 0 && <li className="text-sm text-muted-foreground">No hay reseñas: en la web se muestran las de respaldo hasta que cargues alguna.</li>}
      </ul>
    </div>
  )
}
