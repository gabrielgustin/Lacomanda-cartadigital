'use client'

import { useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import { Download, RotateCcw } from 'lucide-react'
import { saveSiteUrl } from '@/app/backoffice/actions'
import { ErrorNote, Field, btnOutline, btnPrimary, inputClass, useRunner } from '@/components/backoffice/ui'

const QR_SIZE = 1024
const QUIET_ZONE = 64

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// La web principal vive en el dominio raíz; la carta, bajo /carta.
const WEB_URL = 'https://lacomandaa.com.ar'

function QrCard({ title, url, filename }: { title: string; url: string; filename: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  const svgMarkup = () => {
    const svg = wrapperRef.current?.querySelector('svg')
    if (!svg) return null
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(QR_SIZE))
    clone.setAttribute('height', String(QR_SIZE))
    return new XMLSerializer().serializeToString(clone)
  }

  const downloadSvg = () => {
    const markup = svgMarkup()
    if (markup) saveBlob(new Blob([markup], { type: 'image/svg+xml' }), `${filename}.svg`)
  }

  const downloadPng = () => {
    const markup = svgMarkup()
    if (!markup) return
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = QR_SIZE + QUIET_ZONE * 2
      const context = canvas.getContext('2d')
      if (!context) return
      // Fondo blanco y margen: sin zona de silencio muchos lectores no detectan el QR.
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, QUIET_ZONE, QUIET_ZONE, QR_SIZE, QR_SIZE)
      canvas.toBlob((blob) => blob && saveBlob(blob, `${filename}.png`), 'image/png')
    }
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-3 text-center text-lg">{title}</h2>
      <div ref={wrapperRef} className="mx-auto aspect-square w-full max-w-64 rounded-xl bg-white p-4">
        <QRCode value={url} level="M" style={{ width: '100%', height: '100%' }} />
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="mt-4 block break-all text-center text-xs text-muted-foreground underline-offset-2 hover:underline">
        {url}
      </a>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" className={btnPrimary} onClick={downloadPng}>
          <Download className="h-4 w-4" aria-hidden />
          Descargar PNG
        </button>
        <button type="button" className={btnOutline} onClick={downloadSvg}>
          <Download className="h-4 w-4" aria-hidden />
          SVG
        </button>
      </div>
    </div>
  )
}

export function QrPanel({ savedUrl, detectedUrl }: { savedUrl: string | null; detectedUrl: string }) {
  const [input, setInput] = useState(savedUrl ?? '')
  const [saved, setSaved] = useState(false)
  const { pending, error, run } = useRunner()
  const effectiveUrl = savedUrl ?? detectedUrl
  const isLocal = /^https?:\/\/(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(effectiveUrl)
  const dirty = input.trim() !== (savedUrl ?? '')

  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      <QrCard title="Carta digital" url={effectiveUrl} filename="qr-carta" />
      <QrCard title="Página web" url={WEB_URL} filename="qr-web" />

      <div className="space-y-4 rounded-lg border border-border bg-card p-5 md:col-span-2">
        <h2 className="text-lg">Dirección de la carta digital</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Es la dirección que abre el cliente al escanear el código. Si todavía no publicaste la carta, dejala vacía y se usa la dirección actual.
        </p>
        <Field label="Dirección web">
          <input
            type="url"
            className={inputClass}
            placeholder={detectedUrl}
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setSaved(false)
            }}
          />
        </Field>
        {isLocal && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
            Esta dirección es local: el código solo funciona en esta computadora. Cargá la dirección pública de tu carta antes de imprimirlo.
          </p>
        )}
        <ErrorNote message={error} />
        {saved && !dirty && (
          <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900">
            Dirección guardada.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button type="button" className={btnPrimary} disabled={pending || !dirty} onClick={() => run(() => saveSiteUrl(input), () => setSaved(true))}>
            {pending ? 'Guardando…' : 'Guardar dirección'}
          </button>
          {savedUrl && (
            <button
              type="button"
              className={btnOutline}
              disabled={pending}
              onClick={() =>
                run(
                  () => saveSiteUrl(null),
                  () => setInput(''),
                )
              }
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Usar la dirección actual
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
