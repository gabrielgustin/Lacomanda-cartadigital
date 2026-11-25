import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { BASE_PATH } from '@/lib/base-path'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/backoffice-auth'

// Primera barrera: corta las visitas sin sesión antes de renderizar. Cada
// página, acción y ruta del backoffice vuelve a verificar la sesión por su cuenta.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // El manifiesto lo pide el navegador sin cookies: tiene que ser público.
  if (pathname === '/backoffice/login' || pathname === '/backoffice/manifest.webmanifest') return NextResponse.next()

  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  // Detrás del dominio principal, request.url trae el host interno: se redirige al host que vio el visitante.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host
  const protocol = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  return NextResponse.redirect(`${protocol}://${host}${BASE_PATH}/backoffice/login`)
}

export const config = {
  matcher: ['/backoffice/:path*', '/api/backoffice/:path*'],
}
