'use client'

import { useState } from 'react'
import { saveBusiness } from '@/app/backoffice/settings-actions'
import { ErrorNote, Field, btnPrimary, inputClass, useRunner } from '@/components/backoffice/ui'
import type { Negocio } from '@/lib/settings'
import { toWhatsAppNumber } from '@/lib/whatsapp'

const previewId = 'business-whatsapp-preview'

export function BusinessForm({ initial }: { initial: Negocio }) {
  const [draft, setDraft] = useState(initial)
  const [saved, setSaved] = useState(false)
  const row = useRunner()

  const set = (key: keyof Negocio, value: string) => {
    setSaved(false)
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const phone = draft.whatsapp.trim()
  const waNumber = phone ? toWhatsAppNumber(phone) : null

  return (
    <form
      className="space-y-6 rounded-3xl border border-border bg-card p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault()
        setSaved(false)
        row.run(() => saveBusiness(draft), () => setSaved(true))
      }}
    >
      <div className="space-y-1.5">
        <Field label="WhatsApp" hint="Número del local, ej. 351 555-1234. Los clientes pueden escribirte desde el seguimiento del pedido.">
          <input
            type="tel"
            className={inputClass}
            maxLength={30}
            value={draft.whatsapp}
            aria-describedby={previewId}
            onChange={(event) => set('whatsapp', event.target.value)}
          />
        </Field>
        <p id={previewId} aria-live="polite" className={phone && !waNumber ? 'text-xs text-red-800' : 'text-xs text-muted-foreground'}>
          {!phone ? null : waNumber ? (
            <>
              Se abrirá como: <span className="break-all font-mono">https://wa.me/{waNumber}</span>
            </>
          ) : (
            'No parece un número argentino válido.'
          )}
        </p>
      </div>

      <Field label="Dirección" hint="Calle, número y barrio.">
        <input className={inputClass} maxLength={200} value={draft.direccion} onChange={(event) => set('direccion', event.target.value)} />
      </Field>

      <Field label="Instagram" hint="Enlace completo a tu perfil.">
        <input
          type="url"
          className={inputClass}
          placeholder="https://instagram.com/tu-local"
          value={draft.instagram}
          onChange={(event) => set('instagram', event.target.value)}
        />
      </Field>

      <Field label="Facebook" hint="Enlace completo a tu página.">
        <input
          type="url"
          className={inputClass}
          placeholder="https://facebook.com/tu-local"
          value={draft.facebook}
          onChange={(event) => set('facebook', event.target.value)}
        />
      </Field>

      <ErrorNote message={row.error} />

      <div className="flex flex-wrap items-center justify-end gap-3">
        {saved && (
          <p role="status" className="text-sm font-medium text-primary">
            Guardado
          </p>
        )}
        <button type="submit" className={btnPrimary} disabled={row.pending}>
          {row.pending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
