import { connection } from 'next/server'
import { HoursEditor } from '@/components/backoffice/hours-editor'
import { PageShell } from '@/components/backoffice/page-shell'
import { getStoreStrict } from '@/lib/store'

export default async function HorariosPage() {
  await connection()
  const { settings } = await getStoreStrict()
  return (
    <PageShell title="Horarios de atención" backHref="/backoffice">
      <HoursEditor horarios={settings.horarios} aceptarFueraDeHorario={settings.aceptarFueraDeHorario} />
    </PageShell>
  )
}
