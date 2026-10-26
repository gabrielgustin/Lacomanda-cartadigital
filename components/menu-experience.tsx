'use client'

import { Fragment, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { AdminLink } from '@/components/admin-link'
import { CategoryNav } from '@/components/category-nav'
import { LanguageToggle } from '@/components/language-toggle'
import { useLanguage } from '@/components/language-provider'
import { MenuItemCard } from '@/components/menu-item-card'
import { useSiteTheme } from '@/components/site-theme'
import { OrderBar } from '@/components/order-sheet'
import { useOrder } from '@/components/order-provider'
import { PromosPanel } from '@/components/promos-panel'
import { ProductDialog } from '@/components/product-dialog'
import { normalizeText } from '@/lib/format'
import { type MenuItem } from '@/lib/menu-data'
import { DEFAULT_FOOTER_URL, DEFAULT_LOGO_URL } from '@/lib/theme'
import { useActiveSection } from '@/lib/use-active-section'

export function MenuExperience() {
  const { lang, t } = useLanguage()
  const theme = useSiteTheme()
  const { sections: menu, count } = useOrder()
  const [query, setQuery] = useState('')
  const [portions, setPortions] = useState<4 | 8>(8)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const stickyRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const needle = normalizeText(query.trim())
    return menu
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            (!item.portions || item.portions === portions) &&
            normalizeText(`${item.name[lang]} ${item.description[lang]} ${item.group?.[lang] ?? ''}`).includes(needle),
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [menu, query, lang, portions])

  const { activeSection, selectSection } = useActiveSection(
    filtered.map((section) => section.id),
    stickyRef,
  )

  const resultCount = filtered.reduce((sum, section) => sum + section.items.length, 0)
  const isFiltering = query.trim() !== ''
  const selectedSection = selectedItem ? menu.find((section) => section.id === selectedItem.sectionId) : undefined

  const clearFilters = () => setQuery('')

  return (
    <main className={`min-h-screen bg-background text-foreground ${count > 0 ? 'pb-24' : ''}`}>
      <header
        className="hero-pattern relative border-b border-border"
        style={theme.heroImageUrl ? { backgroundImage: `url(${theme.heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {theme.showLanguage && <LanguageToggle />}
        <AdminLink />
        <div className="mx-auto flex max-w-(--content-width) flex-col items-center px-5 pb-6 pt-4 text-center sm:pb-8 sm:pt-6">
          <Image
            src={theme.logoUrl ?? DEFAULT_LOGO_URL}
            alt={t.logoAlt}
            width={272}
            height={272}
            priority
            className={`logo-frame rounded-logo ${theme.logoFit === 'contain' ? 'object-contain' : 'object-cover'}`}
          />
        </div>
      </header>

      <div ref={stickyRef} className="sticky top-0 z-20 border-b border-border bg-nav">
        <div className="mx-auto max-w-(--content-width)">
          <CategoryNav sections={filtered.map((section) => ({ id: section.id, label: section.label[lang], icon: section.icon }))} activeSection={activeSection} onSelect={selectSection} />
        </div>
      </div>

      <div className="mx-auto max-w-(--content-width) px-5 pb-16 pt-8 sm:pt-12">
        {theme.showSearch && (
        <div className="mx-auto mb-12 max-w-xl space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-12 w-full rounded-pill border border-border bg-card pl-11 pr-5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label={t.searchLabel}
            />
          </div>
          <p className="sr-only" aria-live="polite">
            {isFiltering ? t.resultsCount(resultCount) : ''}
          </p>
        </div>
        )}

        {!isFiltering && <PromosPanel />}

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">{t.noResults}</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-pill border border-border bg-card px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              {t.clearFilters}
            </button>
          </div>
        ) : (
          <div className="space-y-14">
            {filtered.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24" aria-labelledby={`${section.id}-title`}>
                <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">{section.eyebrow[lang]}</p>
                    <h2 id={`${section.id}-title`} className="font-heading text-[clamp(1.5rem,6.4vw,1.875rem)] text-heading [overflow-wrap:anywhere] sm:text-4xl">
                      {section.title[lang]}
                    </h2>
                  </div>
                  {section.items.some((item) => item.portions) && (
                    <div role="radiogroup" aria-label={t.portionsLabel} className="flex shrink-0 rounded-pill border border-border bg-card p-1 text-xs font-semibold">
                      {([8, 4] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          role="radio"
                          aria-checked={portions === size}
                          onClick={() => setPortions(size)}
                          className={`rounded-pill px-3 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${portions === size ? 'bg-button text-button-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {t.portionsOption(size)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className={`grid ${
                    section.layout === 'compact'
                      ? 'grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4'
                      : `${theme.itemStyle === 'cards' ? 'gap-6' : 'gap-4'} ${theme.columns === 2 ? 'sm:grid-cols-2' : 'mx-auto max-w-2xl'}`
                  }`}
                >
                  {section.items.map((item, index) => {
                    const group = item.group?.[lang]
                    return (
                      <Fragment key={item.id}>
                        {/* Subcategoría: un título con filete que ocupa toda la fila, cada vez que cambia el grupo. */}
                        {group && group !== section.items[index - 1]?.group?.[lang] && (
                          <h3 className="col-span-full flex items-center gap-4 pt-2 text-base font-semibold text-primary [text-transform:none]">
                            <span>{group}</span>
                            <span aria-hidden className="h-px flex-1 bg-border" />
                          </h3>
                        )}
                        <MenuItemCard item={item} compact={section.layout === 'compact'} onOpen={setSelectedItem} />
                      </Fragment>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {selectedItem && selectedSection && <ProductDialog item={selectedItem} section={selectedSection} onClose={() => setSelectedItem(null)} />}
      <OrderBar />

      <footer className="border-t border-border bg-footer px-5 py-6 text-center">
        {theme.showFooterImage && (
          <Image src={theme.footerUrl ?? DEFAULT_FOOTER_URL} alt={t.footerAlt} width={144} height={144} className="mx-auto h-36 w-36 object-contain" />
        )}
      </footer>
    </main>
  )
}
