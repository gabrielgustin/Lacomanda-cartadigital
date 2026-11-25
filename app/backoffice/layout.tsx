import type { Metadata } from 'next'
import { withBase } from '@/lib/base-path'
import { Inter, Oswald } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const oswald = Oswald({ subsets: ['latin'], weight: ['500', '600'] })

export const metadata: Metadata = {
  title: 'Backoffice | Autogestiva',
  description: 'Panel de administración de la carta digital',
  robots: { index: false, follow: false },
  manifest: withBase('/backoffice/manifest.webmanifest'),
  icons: { icon: withBase('/panel-icon-192.png'), apple: withBase('/panel-icon-192.png') },
}

// Todos los backoffice de Autogestiva comparten esta apariencia, sin importar el
// diseño de la carta del cliente. Se aplica a :root (y no a un contenedor) para
// que también alcance a los diálogos, que se montan fuera del panel.
const css = `
:root{--background:#ffffff;--foreground:#1f2937;--card:#ffffff;--card-foreground:#1f2937;--primary:#1e4b8e;--primary-foreground:#ffffff;--muted:#f3f4f6;--muted-foreground:#6b7280;--border:#e5e7eb;--input:#e5e7eb;--ring:#1e4b8e}
/* Títulos de las páginas del panel: tipografía condensada, un solo estilo para todos. */
.title-font{font-family:${oswald.style.fontFamily},ui-sans-serif,system-ui,sans-serif}
body{font-family:${inter.style.fontFamily},ui-sans-serif,system-ui,sans-serif}
::selection{background:#1e4b8e33}
`

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{css}</style>
      {children}
    </>
  )
}
