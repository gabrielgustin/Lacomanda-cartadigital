import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { OrderTracking } from '@/components/order-tracking'
import { PageShell } from '@/components/page-shell'
import { StoreProviders } from '@/components/store-providers'
import { getOrderByToken, toPublicOrder } from '@/lib/orders'

export const metadata: Metadata = { title: 'Seguimiento de tu pedido', robots: { index: false, follow: false } }

export default async function TrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ nuevo?: string }>
}) {
  await connection()
  const { token } = await params
  const order = await getOrderByToken(token)
  if (!order) notFound()

  return (
    <StoreProviders>
      <PageShell>
        <OrderTracking token={token} initial={toPublicOrder(order)} isNew={(await searchParams).nuevo === '1'} />
      </PageShell>
    </StoreProviders>
  )
}
