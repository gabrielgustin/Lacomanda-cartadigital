import { query } from '@/lib/db'

// Sirve las imágenes subidas desde el backoffice (tabla `media`). Los nombres son aleatorios y
// nunca se reescriben, por eso la caché puede ser inmutable (el CDN de Vercel las guarda tras el primer pedido).
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!/^[a-f0-9]{16}\.(png|jpg|webp)$/.test(name)) return new Response('Not found', { status: 404 })

  try {
    const [row] = await query<{ content_type: string; bytes: Buffer }>('SELECT content_type, bytes FROM media WHERE name = $1', [name])
    if (!row) return new Response('Not found', { status: 404 })
    return new Response(new Uint8Array(row.bytes), {
      headers: {
        'Content-Type': row.content_type,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[media] No se pudo leer la imagen', error)
    return new Response('Error', { status: 500 })
  }
}
