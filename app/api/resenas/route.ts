import { NextResponse } from 'next/server'
import { resenasPublicas } from '@/lib/resenas'

// Reseñas visibles para la web del local (solo lectura).
export async function GET() {
  try {
    return NextResponse.json({ resenas: await resenasPublicas() }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } })
  } catch (error) {
    console.error('resenas', error)
    return NextResponse.json({ error: 'No se pudieron leer las reseñas.' }, { status: 500 })
  }
}
