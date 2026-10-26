'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  deleteCategory,
  moveCategory,
  saveCategory,
  setCategoryVisible,
  type CategoryInput,
} from '@/app/backoffice/actions'
import { ErrorNote, Field, Switch, btnDanger, btnIcon, btnOutline, btnPrimary, inputClass, useRunner } from '@/components/backoffice/ui'
import { Modal } from '@/components/modal'
import { categoryIcons, getCategoryIcon } from '@/lib/category-icons'
import type { MenuSection } from '@/lib/menu-data'
import { cn } from '@/lib/utils'

const emptyCategory = (): CategoryInput => ({
  label: { es: '', en: '' },
  title: { es: '', en: '' },
  eyebrow: { es: '', en: '' },
  icon: 'utensils',
  visible: true,
})

const toInput = (section: MenuSection): CategoryInput => ({
  id: section.id,
  label: section.label,
  title: section.title,
  eyebrow: section.eyebrow,
  icon: section.icon,
  visible: section.visible,
})

export function CategoriesManager({ sections }: { sections: MenuSection[] }) {
  const [editing, setEditing] = useState<CategoryInput | null>(null)
  const [deleting, setDeleting] = useState<MenuSection | null>(null)
  const row = useRunner()

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          El orden de esta lista es el de la carta. Las categorías ocultas no se muestran a los clientes.
        </p>
        <button type="button" className={btnPrimary} onClick={() => setEditing(emptyCategory())}>
          <Plus className="h-4 w-4" aria-hidden />
          Nueva categoría
        </button>
      </div>

      <div className="mb-4">
        <ErrorNote message={row.error} />
      </div>

      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Todavía no hay categorías. Creá la primera para empezar a cargar productos.
        </p>
      ) : (
        <ul className="space-y-3">
          {sections.map((section, index) => {
            const Icon = getCategoryIcon(section.icon)
            return (
              <li
                key={section.id}
                className={cn('flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 sm:flex-nowrap sm:p-4', !section.visible && 'opacity-70')}
              >
                <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-primary ring-1 ring-border">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-base text-foreground">
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="truncate">{section.label.es}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {section.items.length === 1 ? '1 producto' : `${section.items.length} productos`}
                    {section.label.en !== section.label.es && ` · EN: ${section.label.en}`}
                    {!section.visible && ' · Oculta'}
                  </p>
                </div>
                <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                  <Switch
                    checked={section.visible}
                    disabled={row.pending}
                    label={section.visible ? `Ocultar ${section.label.es}` : `Mostrar ${section.label.es}`}
                    onChange={(value) => row.run(() => setCategoryVisible(section.id, value))}
                  />
                  <button type="button" className={btnIcon} disabled={row.pending || index === 0} aria-label={`Subir ${section.label.es}`} onClick={() => row.run(() => moveCategory(section.id, -1))}>
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" className={btnIcon} disabled={row.pending || index === sections.length - 1} aria-label={`Bajar ${section.label.es}`} onClick={() => row.run(() => moveCategory(section.id, 1))}>
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" className={btnIcon} aria-label={`Editar ${section.label.es}`} onClick={() => setEditing(toInput(section))}>
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" className={btnIcon} aria-label={`Eliminar ${section.label.es}`} onClick={() => setDeleting(section)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && <CategoryDialog initial={editing} onClose={() => setEditing(null)} />}
      {deleting && <DeleteDialog section={deleting} onClose={() => setDeleting(null)} />}
    </>
  )
}

function CategoryDialog({ initial, onClose }: { initial: CategoryInput; onClose: () => void }) {
  const [draft, setDraft] = useState(initial)
  const { pending, error, run } = useRunner()
  const isNew = !initial.id

  const setPair = (key: 'label' | 'title' | 'eyebrow', lang: 'es' | 'en', value: string) =>
    setDraft((current) => ({ ...current, [key]: { ...current[key], [lang]: value } }))

  return (
    <Modal labelledBy="category-dialog-title" onClose={onClose} className="max-w-2xl rounded-lg">
      {(close) => (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            run(() => saveCategory(draft), close)
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border p-5">
            <h2 id="category-dialog-title" className="text-xl">
              {isNew ? 'Nueva categoría' : 'Editar categoría'}
            </h2>
            <button type="button" onClick={close} aria-label="Cerrar" className={btnIcon}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre (español)" hint="Aparece en la barra de categorías.">
                <input data-autofocus className={inputClass} required maxLength={40} value={draft.label.es} onChange={(event) => setPair('label', 'es', event.target.value)} />
              </Field>
              <Field label="Nombre (inglés)" hint="Si lo dejás vacío se usa el español.">
                <input className={inputClass} maxLength={40} value={draft.label.en} onChange={(event) => setPair('label', 'en', event.target.value)} />
              </Field>
              <Field label="Título (español)" hint="El encabezado grande de la sección.">
                <input className={inputClass} maxLength={80} value={draft.title.es} onChange={(event) => setPair('title', 'es', event.target.value)} />
              </Field>
              <Field label="Título (inglés)">
                <input className={inputClass} maxLength={80} value={draft.title.en} onChange={(event) => setPair('title', 'en', event.target.value)} />
              </Field>
              <Field label="Frase corta (español)" hint="Texto chico sobre el título.">
                <input className={inputClass} maxLength={80} value={draft.eyebrow.es} onChange={(event) => setPair('eyebrow', 'es', event.target.value)} />
              </Field>
              <Field label="Frase corta (inglés)">
                <input className={inputClass} maxLength={80} value={draft.eyebrow.en} onChange={(event) => setPair('eyebrow', 'en', event.target.value)} />
              </Field>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Ícono</legend>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryIcons).map(([key, { label, Icon }]) => (
                  <button
                    key={key}
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-pressed={draft.icon === key}
                    onClick={() => setDraft((current) => ({ ...current, icon: key }))}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                      draft.icon === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <span>
                <span className="block font-semibold">Visible en la carta</span>
                <span className="text-xs text-muted-foreground">Si la ocultás, los clientes no la ven.</span>
              </span>
              <Switch checked={draft.visible} label="Visible en la carta" onChange={(value) => setDraft((current) => ({ ...current, visible: value }))} />
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

function DeleteDialog({ section, onClose }: { section: MenuSection; onClose: () => void }) {
  const { pending, error, run } = useRunner()
  const count = section.items.length

  return (
    <Modal labelledBy="delete-category-title" onClose={onClose} className="rounded-lg">
      {(close) => (
        <div className="space-y-4 p-6">
          <h2 id="delete-category-title" className="text-xl">
            ¿Eliminar “{section.label.es}”?
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {count > 0
              ? `Se van a eliminar también sus ${count === 1 ? '1 producto' : `${count} productos`}. Esta acción no se puede deshacer. Si solo querés sacarla de la carta, ocultala en su lugar.`
              : 'Esta acción no se puede deshacer.'}
          </p>
          <ErrorNote message={error} />
          <div className="flex justify-end gap-3">
            <button type="button" data-autofocus className={btnOutline} onClick={close}>
              Cancelar
            </button>
            <button type="button" className={btnDanger} disabled={pending} onClick={() => run(() => deleteCategory(section.id), close)}>
              {pending ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
