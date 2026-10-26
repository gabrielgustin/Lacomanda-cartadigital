import Link from 'next/link'
import { Clock, CreditCard, ExternalLink, Grid3X3, Palette, QrCode, Store, Ticket, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { PageShell } from '@/components/backoffice/page-shell'
import { getStoreStrict } from '@/lib/store'

export default async function BackofficeHome() {
  const { sections } = await getStoreStrict()
  const products = sections.reduce((sum, section) => sum + section.items.length, 0)

  const main: { href: string; title: string; detail: string; Icon: LucideIcon }[] = [
    { href: '/backoffice/categorias', title: 'Categorías', detail: sections.length === 1 ? '1 categoría' : `${sections.length} categorías`, Icon: Grid3X3 },
    { href: '/backoffice/productos', title: 'Productos', detail: products === 1 ? '1 producto' : `${products} productos`, Icon: UtensilsCrossed },
  ]
  const custom: { href: string; title: string; Icon: LucideIcon }[] = [
    { href: '/backoffice/codigo-qr', title: 'Código QR', Icon: QrCode },
    { href: '/backoffice/personalizar', title: 'Personaliza tu App', Icon: Palette },
  ]
  const takeaway: { href: string; title: string; detail: string; Icon: LucideIcon }[] = [
    { href: '/backoffice/horarios', title: 'Horarios', detail: 'Días y horas de atención', Icon: Clock },
    { href: '/backoffice/pagos', title: 'Medios de pago', detail: 'Efectivo, transferencia y más', Icon: CreditCard },
    { href: '/backoffice/cupones', title: 'Cupones', detail: 'Descuentos para tus clientes', Icon: Ticket },
    { href: '/backoffice/negocio', title: 'Datos del negocio', detail: 'Nombre, dirección y contacto', Icon: Store },
  ]

  return (
    <PageShell width="max-w-5xl">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {main.map(({ href, title, detail, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex h-30 flex-col items-center justify-center rounded-lg border border-[#1e4b8e] bg-white p-6 text-center transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4b8e]/50"
              >
                <Icon className="mb-2 h-8 w-8 text-[#1e4b8e]" aria-hidden />
                <span className="font-medium text-gray-700">{title}</span>
                <span className="text-xs text-gray-500">{detail}</span>
              </Link>
            ))}
          </div>

          <h2 className="mb-6 text-xl font-medium text-[#1e4b8e]">Personaliza tu tienda</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {custom.map(({ href, title, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4b8e]/50"
              >
                <span className="mr-4 rounded-lg bg-gray-200 p-2">
                  <Icon className="h-5 w-5 text-[#1e4b8e]" aria-hidden />
                </span>
                <span className="font-medium text-gray-700">{title}</span>
              </Link>
            ))}
          </div>

          <h2 className="mb-6 mt-8 title-font text-xl font-medium text-heading">Pedidos por WhatsApp</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {takeaway.map(({ href, title, detail, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="rounded-2xl bg-muted p-2">
                  <Icon className="h-5 w-5 text-heading" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="title-font font-medium text-heading">{title}</span>
                  <span className="text-sm text-muted-foreground">{detail}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="w-full lg:w-[350px]">
          <div className="rounded-lg bg-[#1e4b8e] p-6 text-white">
            <h3 className="mb-6 text-lg font-medium">Conoce más sobre Autogestiva</h3>
            <Link href="https://www.autogestiva.com.ar" target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
              <ExternalLink className="mr-4 h-5 w-5" aria-hidden />
              Visita nuestro sitio web
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
