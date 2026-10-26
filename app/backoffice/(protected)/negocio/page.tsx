import { connection } from 'next/server'
import { BusinessForm } from '@/components/backoffice/business-form'
import { PageShell } from '@/components/backoffice/page-shell'
import { getStoreStrict } from '@/lib/store'

export default async function BusinessPage() {
  await connection()
  const { settings } = await getStoreStrict()
  return (
    <PageShell title="Datos del negocio" backHref="/backoffice">
      <BusinessForm initial={settings.negocio} />
    </PageShell>
  )
}
