import { connection } from 'next/server'
import { CouponsManager } from '@/components/backoffice/coupons-manager'
import { PageShell } from '@/components/backoffice/page-shell'
import { getStoreStrict } from '@/lib/store'

export default async function CouponsPage() {
  await connection()
  const { settings } = await getStoreStrict()
  return (
    <PageShell title="Cupones" backHref="/backoffice">
      <CouponsManager initial={settings.cupones} />
    </PageShell>
  )
}
