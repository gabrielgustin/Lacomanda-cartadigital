import { connection } from 'next/server'
import { PageShell } from '@/components/backoffice/page-shell'
import { ReviewsManager } from '@/components/backoffice/reviews-manager'
import { listarResenas } from '@/lib/resenas'

export default async function ResenasPage() {
  await connection()
  return (
    <PageShell title="Reseñas de la web" backHref="/backoffice">
      <ReviewsManager resenas={await listarResenas()} />
    </PageShell>
  )
}
