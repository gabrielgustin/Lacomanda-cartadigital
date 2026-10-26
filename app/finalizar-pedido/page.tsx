import type { Metadata } from 'next'
import { connection } from 'next/server'
import { CheckoutForm } from '@/components/checkout-form'
import { PageShell } from '@/components/page-shell'
import { StoreProviders } from '@/components/store-providers'
import { acceptsOrdersAt, checkoutSettings, isOpenAt } from '@/lib/settings'
import { getStore } from '@/lib/store'

export const metadata: Metadata = { title: 'Finalizar pedido', robots: { index: false, follow: false } }

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await connection()
  const { tipo } = await searchParams
  const { settings } = await getStore()
  // La hora se evalúa en el servidor y viaja como prop: así no hay diferencias de hidratación.
  return (
    <StoreProviders>
      <PageShell>
        <CheckoutForm
          canOrder={acceptsOrdersAt(settings, new Date())}
          open={isOpenAt(settings, new Date())}
          initialDelivery={tipo === 'delivery' ? 'delivery' : 'retiro'}
          horarios={checkoutSettings(settings).horarios}
          paymentMethods={checkoutSettings(settings).metodosPago}
        />
      </PageShell>
    </StoreProviders>
  )
}
