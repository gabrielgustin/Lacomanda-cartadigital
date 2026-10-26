'use client'

import { useMemo, useState } from 'react'
import { DishImage } from '@/components/dish-image'
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { deleteProduct, moveProduct, saveProduct, setProductVisible, type ProductInput } from '@/app/backoffice/actions'
import { ImageField } from '@/components/backoffice/image-field'
import { ErrorNote, Field, Switch, btnDanger, btnIcon, btnOutline, btnPrimary, inputClass, useRunner } from '@/components/backoffice/ui'
import { Modal } from '@/components/modal'
import { formatPrice, normalizeText } from '@/lib/format'
import type { MenuItem, MenuSection } from '@/lib/menu-data'
import { cn } from '@/lib/utils'

const emptyProduct = (sectionId: string): ProductInput => ({
  sectionId,
  name: { es: '', en: '' },
  description: { es: '', en: '' },
  price: 0,
  image: null,
  visible: true,
})

const toInput = (item: MenuItem): ProductInput => ({
  id: item.id,
  sectionId: item.sectionId,
  name: item.name,
  description: item.description,
  price: item.price,
  image: item.image ?? null,
  group: item.group ?? null,
  visible: item.visible,
})

export function ProductsManager({ sections }: { sections: MenuSection[] }) {
  const [sectionFilter, setSectionFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<ProductInput | null>(null)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)
  const row = useRunner()

  // Si la categoría filtrada se elimina, se vuelve a mostrar todo.
  const activeFilter = sections.some((section) => section.id === sectionFilter) ? sectionFilter : 'all'
  const searching = query.trim() !== ''

  const groups = useMemo(() => {
    const needle = normalizeText(query.trim())
    return sections
      .filter((section) => activeFilter === 'all' || section.id === activeFilter)
      .map((section) => ({
        section,
        items: section.items.filter((item) => !needle || normalizeText(`${item.name.es} ${item.name.en} ${item.description.es}`).includes(needle)),
      }))
      .filter((group) => group.items.length > 0 || (!needle && activeFilter !== 'all'))
  }, [sections, activeFilter, query])

  const total = sections.reduce((sum, section) => sum + section.items.length, 0)

  if (sections.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Primero creá una categoría para poder cargar productos.
      </p>
    )
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto"
            aria-label="Buscar producto"
            className={`${inputClass} pl-10`}
          />
        </div>
        <select
          value={activeFilter}
          onChange={(event) => setSectionFilter(event.target.value)}
          aria-label="Filtrar por categoría"
          className={`${inputClass} sm:w-56`}
        >
          <option value="all">Todas las categorías</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label.es}
            </option>
          ))}
        </select>
        <button type="button" className={btnPrimary} onClick={() => setEditing(emptyProduct(activeFilter === 'all' ? sections[0].id : activeFilter))}>
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo producto
        </button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {total === 1 ? '1 producto' : `${total} productos`} en total. Los productos no disponibles se ocultan de la carta.
      </p>
      <div className="mb-4">
        <ErrorNote message={row.error} />
      </div>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No se encontraron productos.</p>
      ) : (
        <div className="space-y-8">
          {groups.map(({ section, items }) => (
            <section key={section.id} aria-labelledby={`group-${section.id}`}>
              <h2 id={`group-${section.id}`} className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-primary">
                {section.label.es}
                {!section.visible && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tracking-wider text-muted-foreground">Categoría oculta</span>}
              </h2>
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Esta categoría todavía no tiene productos.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => {
                    const position = section.items.findIndex((entry) => entry.id === item.id)
                    return (
                      <li key={item.id} className={cn('flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 sm:flex-nowrap', !item.visible && 'opacity-70')}>
                        <DishImage src={item.image} icon={section.icon} width={56} height={56} sizes="56px" className="h-14 w-14 shrink-0 rounded-xl ring-1 ring-border" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-foreground">{item.name.es}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description.es || 'Sin descripción'}</p>
                        </div>
                        <span className="text-sm font-bold text-primary">{formatPrice(item.price)}</span>
                        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                          <Switch
                            checked={item.visible}
                            disabled={row.pending}
                            label={item.visible ? `Marcar ${item.name.es} como no disponible` : `Marcar ${item.name.es} como disponible`}
                            onChange={(value) => row.run(() => setProductVisible(item.id, value))}
                          />
                          <button type="button" className={btnIcon} disabled={row.pending || searching || position === 0} aria-label={`Subir ${item.name.es}`} onClick={() => row.run(() => moveProduct(item.id, -1))}>
                            <ArrowUp className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={btnIcon}
                            disabled={row.pending || searching || position === section.items.length - 1}
                            aria-label={`Bajar ${item.name.es}`}
                            onClick={() => row.run(() => moveProduct(item.id, 1))}
                          >
                            <ArrowDown className="h-4 w-4" aria-hidden />
                          </button>
                          <button type="button" className={btnIcon} aria-label={`Editar ${item.name.es}`} onClick={() => setEditing(toInput(item))}>
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          <button type="button" className={btnIcon} aria-label={`Eliminar ${item.name.es}`} onClick={() => setDeleting(item)}>
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {editing && <ProductDialog initial={editing} sections={sections} onClose={() => setEditing(null)} />}
      {deleting && <DeleteDialog item={deleting} onClose={() => setDeleting(null)} />}
    </>
  )
}

function ProductDialog({ initial, sections, onClose }: { initial: ProductInput; sections: MenuSection[]; onClose: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [priceText, setPriceText] = useState(initial.id ? String(initial.price) : '')
  const { pending, error, run, setError } = useRunner()
  const isNew = !initial.id
  const section = sections.find((entry) => entry.id === draft.sectionId)

  const setGroup = (lang: 'es' | 'en', value: string) =>
    setDraft((current) => {
      const group = { es: current.group?.es ?? '', en: current.group?.en ?? '', [lang]: value }
      return { ...current, group: group.es || group.en ? group : null }
    })

  const setPair = (key: 'name' | 'description', lang: 'es' | 'en', value: string) =>
    setDraft((current) => ({ ...current, [key]: { ...current[key], [lang]: value } }))

  function submit(close: () => void) {
    // Acepta "8.900", "8900" y "8900,50".
    const normalized = priceText.trim().replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
    const price = Number(normalized)
    if (!normalized || !Number.isFinite(price) || price < 0) {
      setError('Escribí un precio válido, por ejemplo 8900.')
      return
    }
    run(() => saveProduct({ ...draft, price }), close)
  }

  return (
    <Modal labelledBy="product-edit-title" onClose={onClose} className="max-w-2xl rounded-lg">
      {(close) => (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            submit(close)
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border p-5">
            <h2 id="product-edit-title" className="text-xl">
              {isNew ? 'Nuevo producto' : 'Editar producto'}
            </h2>
            <button type="button" onClick={close} aria-label="Cerrar" className={btnIcon}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoría">
                <select className={inputClass} value={draft.sectionId} onChange={(event) => setDraft((current) => ({ ...current, sectionId: event.target.value }))}>
                  {sections.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label.es}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Precio ($)">
                <input className={inputClass} inputMode="decimal" required placeholder="8900" value={priceText} onChange={(event) => setPriceText(event.target.value)} />
              </Field>
              <Field label="Nombre (español)">
                <input data-autofocus className={inputClass} required maxLength={80} value={draft.name.es} onChange={(event) => setPair('name', 'es', event.target.value)} />
              </Field>
              <Field label="Nombre (inglés)" hint="Si lo dejás vacío se usa el español.">
                <input className={inputClass} maxLength={80} value={draft.name.en} onChange={(event) => setPair('name', 'en', event.target.value)} />
              </Field>
              <Field label="Descripción (español)">
                <textarea className={`${inputClass} h-28 resize-none py-2.5 leading-6`} maxLength={400} value={draft.description.es} onChange={(event) => setPair('description', 'es', event.target.value)} />
              </Field>
              <Field label="Descripción (inglés)">
                <textarea className={`${inputClass} h-28 resize-none py-2.5 leading-6`} maxLength={400} value={draft.description.en} onChange={(event) => setPair('description', 'en', event.target.value)} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subcategoría (español)" hint="Opcional. Los platos con la misma subcategoría se muestran juntos bajo un título.">
                <input className={inputClass} maxLength={40} placeholder="Ej: Tradicionales" value={draft.group?.es ?? ''} onChange={(event) => setGroup('es', event.target.value)} />
              </Field>
              <Field label="Subcategoría (inglés)" hint="Si lo dejás vacío se usa el español.">
                <input className={inputClass} maxLength={40} value={draft.group?.en ?? ''} onChange={(event) => setGroup('en', event.target.value)} />
              </Field>
            </div>

            <ImageField
              label="Foto del producto"
              value={draft.image}
              clearLabel="Quitar la foto"
              onChange={(url) => setDraft((current) => ({ ...current, image: url }))}
            />

            <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <span>
                <span className="block font-semibold">Disponible</span>
                <span className="text-xs text-muted-foreground">Si lo desactivás, no aparece en la carta.</span>
              </span>
              <Switch checked={draft.visible} label="Disponible" onChange={(value) => setDraft((current) => ({ ...current, visible: value }))} />
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

function DeleteDialog({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { pending, error, run } = useRunner()

  return (
    <Modal labelledBy="delete-product-title" onClose={onClose} className="rounded-lg">
      {(close) => (
        <div className="space-y-4 p-6">
          <h2 id="delete-product-title" className="text-xl">
            ¿Eliminar “{item.name.es}”?
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">Esta acción no se puede deshacer. Si solo querés sacarlo de la carta por un tiempo, marcalo como no disponible.</p>
          <ErrorNote message={error} />
          <div className="flex justify-end gap-3">
            <button type="button" data-autofocus className={btnOutline} onClick={close}>
              Cancelar
            </button>
            <button type="button" className={btnDanger} disabled={pending} onClick={() => run(() => deleteProduct(item.id), close)}>
              {pending ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
