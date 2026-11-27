import { unstable_cache } from 'next/cache'
import { z } from 'zod'
import { query } from '@/lib/db'

export type Resena = { id: number; autor: string; texto: string; estrellas: number | null; visible: boolean }

export const resenaSchema = z.object({
  autor: z.string().trim().min(2, 'Poné el nombre de quien opinó.').max(60),
  texto: z.string().trim().min(3, 'Escribí la reseña.').max(600),
  estrellas: z.number().int().min(1).max(5).nullable(),
  visible: z.boolean(),
})

const COLUMNS = 'id, autor, texto, estrellas, visible'

export const listarResenas = () => query<Resena>(`SELECT ${COLUMNS} FROM resenas ORDER BY id DESC`)

export const RESENAS_TAG = 'resenas'
// La web las pide seguido: desde la caché no despiertan la base. Se refresca al guardar desde el panel.
export const resenasPublicas = unstable_cache(
  () => query<Omit<Resena, 'id' | 'visible'>>('SELECT autor, texto, estrellas FROM resenas WHERE visible ORDER BY id DESC'),
  ['resenas-publicas'],
  { tags: [RESENAS_TAG], revalidate: 86_400 },
)

export const crearResena = (r: z.infer<typeof resenaSchema>) =>
  query('INSERT INTO resenas (autor, texto, estrellas, visible) VALUES ($1, $2, $3, $4)', [r.autor, r.texto, r.estrellas, r.visible])

export const editarResena = (id: number, r: z.infer<typeof resenaSchema>) =>
  query('UPDATE resenas SET autor = $2, texto = $3, estrellas = $4, visible = $5 WHERE id = $1', [id, r.autor, r.texto, r.estrellas, r.visible])

export const borrarResena = (id: number) => query('DELETE FROM resenas WHERE id = $1', [id])
