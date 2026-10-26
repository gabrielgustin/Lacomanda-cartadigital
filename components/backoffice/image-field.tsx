'use client'

import { useId, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { ErrorNote, btnOutline } from '@/components/backoffice/ui'
import { cn } from '@/lib/utils'

interface ImageFieldProps {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  /** Imagen que se muestra cuando no hay ninguna elegida. */
  fallback?: string
  /** Imágenes ya existentes para elegir con un toque. */
  presets?: string[]
  /** Texto del botón que quita la imagen elegida; si falta, la imagen es obligatoria y no hay botón. */
  clearLabel?: string
  shape?: 'square' | 'round'
}

export function ImageField({ label, value, onChange, fallback, presets = [], clearLabel, shape = 'square' }: ImageFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shown = value ?? fallback ?? null

  async function upload(file: File) {
    setError(null)
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/backoffice/upload', { method: 'POST', body })
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!response.ok || !data.url) throw new Error(data.error ?? 'No se pudo subir la imagen')
      onChange(data.url)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo subir la imagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted',
            shape === 'round' ? 'rounded-full' : 'rounded-xl',
          )}
        >
          {shown ? <Image src={shown} alt="" fill sizes="80px" className="object-cover" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden />}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void upload(file)
            }}
          />
          <button type="button" className={btnOutline} disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
            {uploading ? 'Subiendo…' : 'Subir imagen'}
          </button>
          {value && clearLabel && (
            <button type="button" className={btnOutline} onClick={() => onChange(null)}>
              <X className="h-4 w-4" aria-hidden />
              {clearLabel}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">PNG, JPG o WebP, hasta 3 MB.</p>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Imágenes existentes">
          {presets.map((preset, index) => (
            <button
              key={preset}
              type="button"
              aria-label={`Usar la imagen ${index + 1}`}
              onClick={() => onChange(preset)}
              aria-pressed={value === preset}
              className={cn(
                'relative h-12 w-12 overflow-hidden rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                value === preset ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary',
              )}
            >
              <Image src={preset} alt="" fill sizes="48px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <ErrorNote message={error} />
    </div>
  )
}
