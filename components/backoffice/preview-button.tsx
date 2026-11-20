'use client'

import { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { Modal } from '@/components/modal'
import { withBase } from '@/lib/base-path'

// Abre la carta tal como la ve el cliente en una ventana flotante, sin salir del panel.
export function PreviewButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className={className} aria-label="Ver carta" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <ExternalLink className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Ver carta</span>
      </button>

      {open && (
        <Modal labelledBy="preview-title" onClose={() => setOpen(false)} className="flex h-[85dvh] max-w-md flex-col overflow-hidden rounded-lg">
          {(close) => (
            <>
              <div className="flex shrink-0 items-center justify-between bg-[#1e4b8e] px-4 py-2.5 text-white">
                <h2 id="preview-title" className="text-sm font-medium">
                  Así ven tu carta los clientes
                </h2>
                <button
                  type="button"
                  data-autofocus
                  onClick={close}
                  aria-label="Cerrar vista previa"
                  className="flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <iframe src={withBase('/')} title="Vista previa de la carta digital" className="min-h-0 w-full flex-1 border-0 bg-white" />
            </>
          )}
        </Modal>
      )}
    </>
  )
}
