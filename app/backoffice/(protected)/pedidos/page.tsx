import { OrdersBoard } from '@/components/backoffice/orders-board'
import { PageShell } from '@/components/backoffice/page-shell'
import { listOrders } from '@/lib/orders'

export default async function OrdersPage() {
  const orders = await listOrders(200)
  return (
    <PageShell title="Pedidos" backHref="/backoffice">
      <OrdersBoard initial={orders} />
    </PageShell>
  )
}
