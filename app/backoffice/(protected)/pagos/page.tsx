import { connection } from 'next/server'
import { PageShell } from '@/components/backoffice/page-shell'
import { PaymentMethodsEditor } from '@/components/backoffice/payment-methods-editor'
import { getStoreStrict } from '@/lib/store'

export default async function PaymentMethodsPage() {
  await connection()
  const { settings } = await getStoreStrict()
  return (
    <PageShell title="Medios de pago" backHref="/backoffice">
      <PaymentMethodsEditor initial={settings.metodosPago} />
    </PageShell>
  )
}
