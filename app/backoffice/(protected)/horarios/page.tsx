import { connection } from 'next/server'
import { HoursEditor } from '@/components/backoffice/hours-editor'
import { PageShell } from '@/components/backoffice/page-shell'
import { getStore } from '@/lib/store'

export default async function HorariosPage() {
  await connection()
  const { settings } = await getStore()
  return (
    <PageShell title="Horarios de atención" backHref="/backoffice">
      <HoursEditor horarios={settings.horarios} aceptarFueraDeHorario={settings.aceptarFueraDeHorario} />
    </PageShell>
  )
}
