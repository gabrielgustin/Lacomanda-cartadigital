// Reemplaza las categorías y los platos de la base por los de lib/menu-seed.json.
// Conserva todo lo demás de la tienda (tema, horarios, medios de pago, cupones, datos del negocio, URL del QR).
//
//   pnpm menu:apply --dry-run   muestra qué cambiaría, sin escribir
//   pnpm menu:apply             aplica el cambio
//
// Para producción, pasá su URL de forma explícita:  DATABASE_URL="postgresql://..." node scripts/apply-menu.mts
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

type Item = { id: string; name: { es: string }; visible: boolean }
type Section = { id: string; visible: boolean; items: Item[] }

const dryRun = process.argv.includes('--dry-run')
const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL. Definila en .env.local o pasala en la línea de comando.')
  process.exit(1)
}
const target = new URL(url)
console.log(`Destino: ${target.hostname}${target.port ? ':' + target.port : ''}${target.pathname}${dryRun ? '  (dry-run: no se escribe nada)' : ''}`)

const next: Section[] = JSON.parse(await readFile(path.join(process.cwd(), 'lib', 'menu-seed.json'), 'utf8'))
const count = (sections: Section[]) => sections.reduce((n, s) => n + s.items.length, 0)

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query('BEGIN')
  await client.query('SELECT pg_advisory_xact_lock(727311)')
  const { rows } = await client.query('SELECT data, version FROM store WHERE id = 1 FOR UPDATE')
  const current = rows[0]?.data ?? {}
  const before: Section[] = Array.isArray(current.sections) ? current.sections : []

  console.log(`Antes:   ${before.length} categorías, ${count(before)} productos`)
  console.log(`Después: ${next.length} categorías, ${count(next)} productos (${next.flatMap((s) => s.items).filter((i) => !i.visible).length} ocultos)`)

  const data = JSON.stringify({ ...current, sections: next })
  if (rows[0]) {
    await client.query('UPDATE store SET data = $1::jsonb, version = version + 1, updated_at = now() WHERE id = 1', [data])
  } else {
    await client.query('INSERT INTO store (id, data) VALUES (1, $1::jsonb)', [data])
  }
  await client.query(dryRun ? 'ROLLBACK' : 'COMMIT')
  console.log(dryRun ? 'Dry-run terminado: se deshizo todo.' : 'Listo: la carta quedó actualizada.')
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Falló y se deshizo todo (no quedó nada a medias):', error)
  process.exitCode = 1
} finally {
  await client.end()
}
