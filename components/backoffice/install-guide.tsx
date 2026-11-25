'use client'

import { useEffect, useState } from 'react'
import { AppWindow, Check, Download, EllipsisVertical, Share, SquarePlus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  title: string
  detail?: string
  Icon: LucideIcon
}

const GUIDE: Record<string, { label: string; browsers: Record<string, { label: string; steps: Step[] }> }> = {
  android: {
    label: 'Android',
    browsers: {
      chrome: {
        label: 'Chrome',
        steps: [
          { title: 'Abrí el menú del navegador', detail: 'Tocá los tres puntos (⋮) de arriba a la derecha.', Icon: EllipsisVertical },
          { title: 'Tocá «Instalar app»', detail: 'Si no la ves, buscá «Agregar a la pantalla principal» y confirmá.', Icon: Download },
          { title: 'Abrila como cualquier app', detail: 'Queda el ícono en tu pantalla de inicio y se abre sin la barra del navegador.', Icon: AppWindow },
        ],
      },
      samsung: {
        label: 'Samsung Internet',
        steps: [
          { title: 'Abrí el menú del navegador', detail: 'Tocá las tres rayas (☰) de abajo a la derecha.', Icon: EllipsisVertical },
          { title: 'Tocá «Agregar página a» → «Pantalla de inicio»', detail: 'Confirmá con «Agregar».', Icon: SquarePlus },
          { title: 'Abrila como cualquier app', detail: 'Queda el ícono en tu pantalla de inicio.', Icon: AppWindow },
        ],
      },
    },
  },
  ios: {
    label: 'iPhone / iPad',
    browsers: {
      safari: {
        label: 'Safari',
        steps: [
          { title: 'Tocá el botón Compartir', detail: 'Es el cuadrado con una flecha hacia arriba, en la barra de abajo.', Icon: Share },
          { title: 'Elegí «Agregar a pantalla de inicio»', detail: 'Deslizá la lista hacia arriba si no aparece. Después tocá «Agregar».', Icon: SquarePlus },
          { title: 'Abrila como cualquier app', detail: 'Queda el ícono junto a tus otras apps.', Icon: AppWindow },
        ],
      },
      chrome: {
        label: 'Chrome',
        steps: [
          { title: 'Tocá el botón Compartir', detail: 'Está arriba a la derecha, al lado de la barra de direcciones.', Icon: Share },
          { title: 'Elegí «Agregar a pantalla de inicio»', detail: 'Confirmá con «Agregar».', Icon: SquarePlus },
          { title: 'Abrila como cualquier app', detail: 'Queda el ícono junto a tus otras apps.', Icon: AppWindow },
        ],
      },
    },
  },
  desktop: {
    label: 'Mac / computadora',
    browsers: {
      chrome: {
        label: 'Chrome',
        steps: [
          { title: 'Buscá el ícono de instalar', detail: 'En la barra de direcciones, a la derecha (una pantalla con una flecha). También en ⋮ → «Transmitir, guardar y compartir» → «Instalar La Comanda · Panel».', Icon: Download },
          { title: 'Hacé clic en «Instalar»', Icon: Check },
          { title: 'Abrila como cualquier app', detail: 'Queda en el Launchpad (Mac) o en el menú Inicio (Windows) y se abre en su propia ventana.', Icon: AppWindow },
        ],
      },
      safari: {
        label: 'Safari',
        steps: [
          { title: 'Abrí el menú Archivo', detail: 'Elegí «Agregar al Dock». Hace falta Safari 17 o más nuevo.', Icon: SquarePlus },
          { title: 'Hacé clic en «Agregar»', Icon: Check },
          { title: 'Abrila desde el Dock', detail: 'Se abre en su propia ventana, como cualquier app.', Icon: AppWindow },
        ],
      },
      edge: {
        label: 'Edge',
        steps: [
          { title: 'Abrí el menú del navegador', detail: 'Tocá los tres puntos (···) de arriba a la derecha → «Aplicaciones» → «Instalar este sitio como una aplicación».', Icon: EllipsisVertical },
          { title: 'Hacé clic en «Instalar»', Icon: Check },
          { title: 'Abrila como cualquier app', detail: 'Queda en el menú Inicio y se abre en su propia ventana.', Icon: AppWindow },
        ],
      },
    },
  },
}

const chip = (active: boolean) =>
  cn(
    'rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
    active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary hover:text-primary',
  )

export function InstallGuide() {
  const [device, setDevice] = useState('desktop')
  const [browser, setBrowser] = useState('chrome')

  // Se adelanta el dispositivo y navegador de quien mira; se puede cambiar a mano.
  useEffect(() => {
    const ua = navigator.userAgent
    const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
    const detected = /Android/.test(ua) ? 'android' : /iPhone|iPad/.test(ua) || touchMac ? 'ios' : 'desktop'
    const browserKey = /Edg\//.test(ua) ? 'edge' : /SamsungBrowser/.test(ua) ? 'samsung' : /Chrome|CriOS/.test(ua) ? 'chrome' : /Safari/.test(ua) ? 'safari' : 'chrome'
    setDevice(detected)
    setBrowser(browserKey in GUIDE[detected].browsers ? browserKey : Object.keys(GUIDE[detected].browsers)[0])
  }, [])

  const pickDevice = (key: string) => {
    setDevice(key)
    if (!(browser in GUIDE[key].browsers)) setBrowser(Object.keys(GUIDE[key].browsers)[0])
  }

  const browsers = GUIDE[device].browsers
  const { steps } = browsers[browser] ?? Object.values(browsers)[0]

  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-muted-foreground">
        Instalá el panel y abrilo con un toque, como cualquier otra app, sin buscar el link. Elegí tu dispositivo y seguí los pasos.
      </p>

      <div className="space-y-3">
        <div role="group" aria-label="Dispositivo" className="flex flex-wrap gap-2">
          {Object.entries(GUIDE).map(([key, { label }]) => (
            <button key={key} type="button" aria-pressed={device === key} className={chip(device === key)} onClick={() => pickDevice(key)}>
              {label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Navegador" className="flex flex-wrap gap-2">
          {Object.entries(browsers).map(([key, { label }]) => (
            <button key={key} type="button" aria-pressed={browser === key} className={chip(browser === key)} onClick={() => setBrowser(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map(({ title, detail, Icon }, index) => (
          <li key={title} className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <h2 className="font-medium text-foreground">{title}</h2>
              {detail && <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>}
            </div>
            <Icon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </li>
        ))}
      </ol>

      <p className="text-xs leading-5 text-muted-foreground">Si algo no coincide, es por la versión del navegador: buscá la opción con nombre parecido.</p>
    </div>
  )
}
