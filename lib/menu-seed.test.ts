import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { categoryIcons } from '@/lib/category-icons'
import { seedMenu } from '@/lib/menu-data'

const items = seedMenu.flatMap((s) => s.items)

describe('carta inicial', () => {
  it('ids únicos y cada plato apunta a su categoría', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
    expect(new Set(seedMenu.map((s) => s.id)).size).toBe(seedMenu.length)
    for (const s of seedMenu) for (const i of s.items) expect(i.sectionId).toBe(s.id)
  })

  it('precios enteros y positivos, con nombre en español e inglés', () => {
    for (const i of items) {
      expect(Number.isInteger(i.price) && i.price >= 0, i.id).toBe(true)
      if (i.visible) expect(i.price, i.id).toBeGreaterThan(0)
      expect(i.name.es && i.name.en, i.id).toBeTruthy()
    }
  })

  it('subcategorías contiguas y fotos existentes', () => {
    for (const s of seedMenu) {
      for (const size of [undefined, 4, 8]) {
        const seen = new Set<string>()
        let prev: string | undefined
        for (const i of s.items.filter((entry) => entry.portions === size)) {
          const g = i.group?.es
          if (g && g !== prev) {
            expect(seen.has(g), `${s.id}: ${g} partido`).toBe(false)
            seen.add(g)
          }
          prev = g
        }
      }
    }
    for (const i of items) {
      if (i.image) expect(existsSync(path.join(process.cwd(), 'public', i.image)), i.image).toBe(true)
    }
  })

  it('usa íconos conocidos', () => {
    for (const s of seedMenu) expect(categoryIcons[s.icon], s.id).toBeDefined()
  })
})
