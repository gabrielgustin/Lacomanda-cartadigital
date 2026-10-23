import { connection } from 'next/server'
import { LanguageProvider } from '@/components/language-provider'
import { OrderProvider } from '@/components/order-provider'
import { SiteThemeProvider } from '@/components/site-theme'
import { getStore, publicSections } from '@/lib/store'

// Mismos proveedores que la carta (tema, idioma y pedido), para las pantallas del pedido para llevar.
export async function StoreProviders({ children }: { children: React.ReactNode }) {
  await connection()
  const { sections, theme } = await getStore()

  return (
    <SiteThemeProvider initial={theme}>
      <LanguageProvider>
        <OrderProvider sections={publicSections(sections)}>{children}</OrderProvider>
      </LanguageProvider>
    </SiteThemeProvider>
  )
}
