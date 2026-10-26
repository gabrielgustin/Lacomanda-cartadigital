import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Pruebas contra una base REAL de Postgres. Se saltean solas si no hay TEST_DATABASE_URL.
//   TEST_DATABASE_URL=postgresql://lacomanda@127.0.0.1:5544/lacomanda_test pnpm test
// Por seguridad solo corren contra una base local: vacían las tablas antes de empezar.
const url = process.env.TEST_DATABASE_URL
const isLocal = !!url && /@(127\.0\.0\.1|localhost)[:/]/.test(url)
const run = url && isLocal ? describe : describe.skip

run('persistencia en Postgres', () => {
  let store: typeof import('@/lib/store')
  let orders: typeof import('@/lib/orders')
  let db: typeof import('@/lib/db')

  beforeAll(async () => {
    process.env.DATABASE_URL = url
    db = await import('@/lib/db')
    store = await import('@/lib/store')
    orders = await import('@/lib/orders')
    await db.query('SELECT 1') // crea las tablas
    await db.query('TRUNCATE store, pedidos, media RESTART IDENTITY')
  })

  afterAll(async () => {
    await db?.query('TRUNCATE store, pedidos, media RESTART IDENTITY')
  })

  it('sin fila guardada devuelve la carta base', async () => {
    const data = await store.loadStore()
    expect(data.sections.length).toBeGreaterThan(0)
  })

  it('guarda y vuelve a leer un cambio', async () => {
    await store.updateStore((draft) => {
      draft.siteUrl = 'https://comanda.example/uno'
    })
    expect((await store.loadStore()).siteUrl).toBe('https://comanda.example/uno')
  })

  it('dos ediciones simultáneas se aplican las dos (no se pisan)', async () => {
    await Promise.all([
      store.updateStore((draft) => {
        draft.siteUrl = 'https://comanda.example/dos'
      }),
      store.updateStore((draft) => {
        draft.settings.negocio.direccion = 'Av. Siempreviva 742'
      }),
    ])
    const data = await store.loadStore()
    expect(data.siteUrl).toBe('https://comanda.example/dos')
    expect(data.settings.negocio.direccion).toBe('Av. Siempreviva 742')
  })

  it('no escribe ni cambia la versión si la edición no modifica nada', async () => {
    const [before] = await db.query<{ version: number }>('SELECT version FROM store WHERE id = 1')
    await store.updateStore(() => undefined)
    const [after] = await db.query<{ version: number }>('SELECT version FROM store WHERE id = 1')
    expect(after.version).toBe(before.version)
  })

  it('crea pedidos con precio del servidor, número correlativo y los lee por token', async () => {
    const { seedMenu } = await import('@/lib/menu-data')
    const item = seedMenu[0].items[0]
    const input = { customer: { name: 'Ana', phone: '351 555-1234' }, paymentMethodId: 'efectivo', items: [{ productId: item.id, quantity: 2 }] }

    const first = await orders.createOrder(input)
    const second = await orders.createOrder(input)
    expect(first.id).toBe(1)
    expect(second.id).toBe(2)
    expect(first.total).toBe(item.price * 2)
    expect(typeof first.total).toBe('number')
    expect(first.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    const found = await orders.getOrderByToken(first.token)
    expect(found?.id).toBe(1)
    expect(await orders.getOrderByToken('no-es-un-uuid')).toBeNull()
    expect(await orders.getOrderByToken('3f2b8c1e-9d4a-4e6b-8a1c-2f7d5e9b0c3a')).toBeNull()
  })

  it('cambia el estado, cuenta y lista del más nuevo al más viejo', async () => {
    expect(await orders.countOrders('nuevo')).toBe(2)
    const updated = await orders.updateOrderState(1, 'preparando')
    expect(updated?.estado).toBe('preparando')
    expect(await orders.updateOrderState(999, 'listo')).toBeNull()
    expect(await orders.countOrders('nuevo')).toBe(1)
    expect((await orders.listOrders(10)).map((order) => order.id)).toEqual([2, 1])
  })

  it('rechaza un estado inválido a nivel de base de datos', async () => {
    await expect(db.query("UPDATE pedidos SET estado = 'hackeado' WHERE id = 1")).rejects.toThrow()
  })

  it('un pedido con un plato inexistente falla sin guardar nada', async () => {
    const input = { customer: { name: 'Ana', phone: '351 555-1234' }, paymentMethodId: 'efectivo', items: [{ productId: 'no-existe', quantity: 1 }] }
    await expect(orders.createOrder(input)).rejects.toThrow()
    expect(await orders.listOrders(10)).toHaveLength(2)
  })

  it('guarda y recupera una imagen byte por byte', async () => {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 255, 0])
    await db.query('INSERT INTO media (name, content_type, bytes) VALUES ($1, $2, $3)', ['aaaaaaaaaaaaaaaa.png', 'image/png', bytes])
    const [row] = await db.query<{ bytes: Buffer }>('SELECT bytes FROM media WHERE name = $1', ['aaaaaaaaaaaaaaaa.png'])
    expect(Buffer.compare(row.bytes, bytes)).toBe(0)
  })
})
