import { Pool, type QueryResultRow } from 'pg'
import { SCHEMA_SQL } from '@/lib/db-schema'

// Conexión a Postgres (Neon). Perezosa: no se abre al importar, solo en la primera consulta,
// porque los tests de funciones puras importan estos módulos sin tener base.
const globalForDb = globalThis as unknown as { lcPool?: Pool; lcSchema?: Promise<void> }

function pool() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL (conexión a Neon): definila en .env.local y en las variables de Vercel.')
  // Se guarda en globalThis para que el recargado en caliente de desarrollo no deje conexiones abiertas.
  return (globalForDb.lcPool ??= new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 }))
}

// Crea las tablas la primera vez que cada instancia usa la base. El candado de aviso evita que dos
// instancias que arrancan a la vez ejecuten el DDL en paralelo.
function ensureSchema() {
  return (globalForDb.lcSchema ??= (async () => {
    const client = await pool().connect()
    try {
      await client.query('BEGIN')
      await client.query('SELECT pg_advisory_xact_lock(727311)')
      await client.query(SCHEMA_SQL)
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      globalForDb.lcSchema = undefined // se reintenta en la próxima consulta
      throw error
    } finally {
      client.release()
    }
  })())
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema()
  return (await pool().query<T>(text, params)).rows
}
