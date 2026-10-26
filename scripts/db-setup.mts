// Prepara la base de datos (Neon) y, si existen, importa los datos locales de la carpeta data/.
//
//   pnpm db:setup            importa lo que falte, sin pisar nada
//   pnpm db:setup --force    reemplaza la carta guardada en la base por data/store.json
//   pnpm db:setup --dry-run  solo muestra qué haría, sin escribir
//
// Para producción, pasá su URL explícita:  DATABASE_URL="postgresql://..." node scripts/db-setup.mts
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'
import { SCHEMA_SQL } from '../lib/db-schema.ts'

const force = process.argv.includes('--force')
const dryRun = process.argv.includes('--dry-run')
const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL. Definila en .env.local o pasala en la línea de comando.')
  process.exit(1)
}

const target = new URL(url)
console.log(`Destino: ${target.hostname}${target.port ? ':' + target.port : ''}${target.pathname}${dryRun ? '  (dry-run: no se escribe nada)' : ''}`)

const dataDir = path.join(process.cwd(), 'data')
const readJson = async (file: string) => {
  try {
    return JSON.parse(await readFile(path.join(dataDir, file), 'utf8'))
  } catch {
    return null
  }
}

const TYPES: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  await client.query('BEGIN')
  await client.query('SELECT pg_advisory_xact_lock(727311)')
  await client.query(SCHEMA_SQL)
  console.log('✓ Tablas listas (store, pedidos, media).')

  // ── Carta y configuración ──
  const store = await readJson('store.json')
  if (!store) console.log('· data/store.json no existe: la carta arranca con la carta base.')
  else if (!Array.isArray(store.sections)) console.log('· data/store.json no tiene "sections": se omite.')
  else {
    const existing = await client.query('SELECT version FROM store WHERE id = 1')
    if (existing.rowCount && !force) {
      console.log(`· La base ya tiene una carta guardada (versión ${existing.rows[0].version}): no se pisa. Usá --force para reemplazarla.`)
    } else {
      await client.query(
        `INSERT INTO store (id, data) VALUES (1, $1::jsonb)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, version = store.version + 1, updated_at = now()`,
        [JSON.stringify(store)],
      )
      console.log(`✓ Carta importada: ${store.sections.length} categorías, ${store.sections.reduce((n: number, s: { items: unknown[] }) => n + s.items.length, 0)} platos.`)
    }
  }

  // ── Pedidos (solo si la tabla está vacía) ──
  const orders = await readJson('orders.json')
  if (Array.isArray(orders) && orders.length > 0) {
    const { rows } = await client.query('SELECT count(*)::int AS n FROM pedidos')
    if (rows[0].n > 0) console.log(`· La tabla pedidos ya tiene ${rows[0].n} pedidos: no se importan los del archivo.`)
    else {
      for (const o of orders) {
        await client.query(
          `INSERT INTO pedidos (id, token, estado, cliente_nombre, cliente_telefono, notas, forma_entrega, subtotal, descuento, cupon, metodo_pago, total, items, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15)`,
          [o.id, o.token, o.estado, o.clienteNombre, o.clienteTelefono, o.notas ?? null, o.formaEntrega, o.subtotal, o.descuento ?? 0, o.cupon ?? null, o.metodoPago ?? null, o.total, JSON.stringify(o.items), o.createdAt, o.updatedAt],
        )
      }
      // Sin esto, el próximo pedido nuevo chocaría con un número ya importado.
      await client.query(`SELECT setval(pg_get_serial_sequence('pedidos', 'id'), (SELECT max(id) FROM pedidos))`)
      console.log(`✓ ${orders.length} pedidos importados (la numeración continúa desde el último).`)
    }
  }

  // ── Imágenes subidas ──
  let images = 0
  try {
    for (const name of await readdir(path.join(dataDir, 'uploads'))) {
      const type = TYPES[path.extname(name).toLowerCase()]
      if (!type) continue
      const bytes = await readFile(path.join(dataDir, 'uploads', name))
      await client.query('INSERT INTO media (name, content_type, bytes) VALUES ($1,$2,$3) ON CONFLICT (name) DO NOTHING', [name, type, bytes])
      images++
    }
  } catch {
    // no hay carpeta de imágenes
  }
  if (images) console.log(`✓ ${images} imágenes importadas.`)

  await client.query(dryRun ? 'ROLLBACK' : 'COMMIT')
  console.log(dryRun ? 'Dry-run terminado: se deshizo todo.' : 'Listo.')
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Falló y se deshizo todo (no quedó nada a medias):', error)
  process.exitCode = 1
} finally {
  await client.end()
}
