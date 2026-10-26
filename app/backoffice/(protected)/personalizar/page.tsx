import { PageShell } from '@/components/backoffice/page-shell'
import { ThemeEditor } from '@/components/backoffice/theme-editor'
import { getStoreStrict } from '@/lib/store'

export default async function CustomizePage() {
  const { theme } = await getStoreStrict()

  return (
    <PageShell title="Personaliza tu App" backHref="/backoffice" width="max-w-7xl">
      <ThemeEditor initial={theme} />
    </PageShell>
  )
}
