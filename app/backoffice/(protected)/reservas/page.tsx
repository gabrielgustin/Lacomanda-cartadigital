import { connection } from 'next/server'
import { PageShell } from '@/components/backoffice/page-shell'
import { ReservationsManager } from '@/components/backoffice/reservations-manager'
import { hoyAR, listarReservas } from '@/lib/reservas'

export default async function ReservasPage() {
  await connection()
  const reservas = await listarReservas()
  return (
    <PageShell title="Reservas de mesa" backHref="/backoffice">
      <ReservationsManager reservas={reservas} hoy={hoyAR()} />
    </PageShell>
  )
}
