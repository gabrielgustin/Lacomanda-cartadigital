import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/backoffice-auth'
import { query } from '@/lib/db'

// Vercel limita el cuerpo de una función a 4,5 MB: con 3 MB sobra margen para el formulario multipart.
const MAX_BYTES = 3 * 1024 * 1024

const CONTENT_TYPES: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }

// Se identifica el formato por los primeros bytes, no por lo que declare el navegador.
function detectExtension(bytes: Uint8Array) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return '.png'
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return '.jpg'
  const riff = String.fromCharCode(...bytes.slice(0, 4)) + String.fromCharCode(...bytes.slice(8, 12))
  if (riff === 'RIFFWEBP') return '.webp'
  return null
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'La imagen supera los 3 MB' }, { status: 413 })

  const bytes = new Uint8Array(await file.arrayBuffer())
  const extension = detectExtension(bytes)
  if (!extension) return NextResponse.json({ error: 'Formato no válido. Usá PNG, JPG o WebP' }, { status: 415 })

  const name = `${randomBytes(8).toString('hex')}${extension}`
  try {
    await query('INSERT INTO media (name, content_type, bytes) VALUES ($1, $2, $3)', [name, CONTENT_TYPES[extension], Buffer.from(bytes)])
  } catch (error) {
    console.error('[upload] No se pudo guardar la imagen', error)
    return NextResponse.json({ error: 'No se pudo guardar la imagen en el servidor' }, { status: 500 })
  }
  return NextResponse.json({ url: `/media/${name}` })
}
