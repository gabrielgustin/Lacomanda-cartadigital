import { CategoriesManager } from '@/components/backoffice/categories-manager'
import { PageShell } from '@/components/backoffice/page-shell'
import { getStoreStrict } from '@/lib/store'

export default async function CategoriesPage() {
  const { sections } = await getStoreStrict()
  return (
    <PageShell title="Categorías" backHref="/backoffice">
      <CategoriesManager sections={sections} />
    </PageShell>
  )
}
