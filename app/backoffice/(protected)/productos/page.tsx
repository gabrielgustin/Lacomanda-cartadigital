import { PageShell } from '@/components/backoffice/page-shell'
import { ProductsManager } from '@/components/backoffice/products-manager'
import { getStoreStrict } from '@/lib/store'

export default async function ProductsPage() {
  const { sections } = await getStoreStrict()
  return (
    <PageShell title="Productos" backHref="/backoffice">
      <ProductsManager sections={sections} />
    </PageShell>
  )
}
