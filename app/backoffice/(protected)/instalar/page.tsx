import { InstallGuide } from '@/components/backoffice/install-guide'
import { PageShell } from '@/components/backoffice/page-shell'

export default function InstallPage() {
  return (
    <PageShell title="Instalar el panel" backHref="/backoffice">
      <InstallGuide />
    </PageShell>
  )
}
