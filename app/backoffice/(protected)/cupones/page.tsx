import { connection } from 'next/server'
import { CouponsManager } from '@/components/backoffice/coupons-manager'
import { PageShell } from '@/components/backoffice/page-shell'
import { getStore } from '@/lib/store'

export default async function CouponsPage() {
  await connection()
  const { settings } = await getStore()
  return (
    <PageShell title="Cupones" backHref="/backoffice">
      <CouponsManager initial={settings.cupones} />
    </PageShell>
  )
}
