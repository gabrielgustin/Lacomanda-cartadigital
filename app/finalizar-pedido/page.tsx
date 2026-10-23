import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/checkout-form'
import { PageShell } from '@/components/page-shell'
import { StoreProviders } from '@/components/store-providers'

export const metadata: Metadata = { title: 'Finalizar pedido', robots: { index: false, follow: false } }

export default function CheckoutPage() {
  return (
    <StoreProviders>
      <PageShell>
        <CheckoutForm />
      </PageShell>
    </StoreProviders>
  )
}
