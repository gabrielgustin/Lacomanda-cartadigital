import { BASE_PATH } from '@/lib/base-path'

// Permite instalar el panel como app (ventana propia, ícono en el escritorio o la pantalla de inicio).
export function GET() {
  return Response.json(
    {
      name: 'La Comanda · Panel',
      short_name: 'Panel',
      description: 'Panel de administración de la carta digital',
      start_url: `${BASE_PATH}/backoffice`,
      scope: `${BASE_PATH}/backoffice`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#1e4b8e',
      icons: [192, 512].map((size) => ({ src: `${BASE_PATH}/panel-icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
}
