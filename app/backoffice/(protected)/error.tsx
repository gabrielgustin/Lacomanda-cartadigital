'use client'

import Link from 'next/link'
import { btnPrimary } from '@/components/backoffice/ui'

// Si la base de datos no responde (o todavía no está conectada), el panel lo explica en vez de mostrar un error en blanco.
export default function BackofficeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800">El panel no puede conectarse a la base de datos</h1>
        <p className="text-sm leading-6 text-gray-600">
          Tu sesión está bien. Falta la conexión a la base: creá la base Neon desde Vercel (Storage) o revisá <code>DATABASE_URL</code>, y volvé a intentar.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className={btnPrimary}>
            Reintentar
          </button>
          <Link href="/" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Volver a la carta
          </Link>
        </div>
      </div>
    </div>
  )
}
