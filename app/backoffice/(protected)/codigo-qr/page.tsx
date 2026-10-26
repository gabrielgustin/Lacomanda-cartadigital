import { headers } from 'next/headers'
import { PageShell } from '@/components/backoffice/page-shell'
import { QrPanel } from '@/components/backoffice/qr-panel'
import { getStoreStrict } from '@/lib/store'

export default async function QrPage() {
  const { siteUrl } = await getStoreStrict()
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'localhost:3000'
  const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')

  return (
    <PageShell title="Código QR" backHref="/backoffice">
      <QrPanel savedUrl={siteUrl} detectedUrl={`${protocol}://${host}/`} />
    </PageShell>
  )
}
