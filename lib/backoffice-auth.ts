import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const SESSION_COOKIE = 'lc_admin'
const SESSION_SECONDS = 60 * 60 * 12

const user = () => process.env.BACKOFFICE_USER || 'admin'
const password = () => process.env.BACKOFFICE_PASSWORD ?? ''
// Si no hay BACKOFFICE_SECRET, la firma se deriva de la clave: cambiarla cierra todas las sesiones.
const secret = () => process.env.BACKOFFICE_SECRET || `lc:${user()}:${password()}`

export const isConfigured = () => password().length > 0

/** Dónde se define la clave: en el deploy son las variables de Vercel, en tu compu el archivo .env.local. */
export const configHint = () =>
  process.env.VERCEL ? 'Falta definir BACKOFFICE_PASSWORD en las variables de entorno de Vercel (Settings → Environment Variables) y volver a desplegar.' : 'Falta definir BACKOFFICE_PASSWORD en el archivo .env.local.'

const sign = (value: string) => createHmac('sha256', secret()).update(value).digest('base64url')

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

// Se comparan siempre los dos campos para no revelar cuál de ellos falló.
export const checkCredentials = (candidateUser: string, candidatePassword: string) => {
  const userOk = safeEqual(candidateUser.trim().toLowerCase(), user().toLowerCase())
  const passwordOk = safeEqual(candidatePassword, password())
  return isConfigured() && userOk && passwordOk
}

export function createSessionToken() {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS)
  return `${expires}.${sign(expires)}`
}

export function verifySessionToken(token: string | undefined) {
  if (!token || !isConfigured()) return false
  const [expires, signature] = token.split('.')
  if (!expires || !signature || !safeEqual(signature, sign(expires))) return false
  return Number(expires) > Date.now() / 1000
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_SECONDS,
}

export async function isAdmin() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
}

/** Verificación real de la sesión: la usan las páginas, las acciones y las rutas del backoffice. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/backoffice/login')
}
