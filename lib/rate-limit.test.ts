import { afterEach, describe, expect, it, vi } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  afterEach(() => vi.useRealTimers())

  it('deja pasar hasta el máximo y corta el siguiente', () => {
    const results = Array.from({ length: 4 }, () => rateLimit('ip-a', 3, 60_000))
    expect(results).toEqual([true, true, true, false])
  })

  it('cada clave cuenta por separado', () => {
    for (let i = 0; i < 3; i++) rateLimit('ip-b', 3, 60_000)
    expect(rateLimit('ip-b', 3, 60_000)).toBe(false)
    expect(rateLimit('ip-c', 3, 60_000)).toBe(true)
  })

  it('vuelve a aceptar cuando pasa la ventana', () => {
    vi.useFakeTimers()
    for (let i = 0; i < 2; i++) rateLimit('ip-d', 2, 1_000)
    expect(rateLimit('ip-d', 2, 1_000)).toBe(false)
    vi.advanceTimersByTime(1_001)
    expect(rateLimit('ip-d', 2, 1_000)).toBe(true)
  })

  it('un intento rechazado no extiende el bloqueo', () => {
    vi.useFakeTimers()
    rateLimit('ip-e', 1, 1_000)
    vi.advanceTimersByTime(900)
    expect(rateLimit('ip-e', 1, 1_000)).toBe(false)
    vi.advanceTimersByTime(200)
    expect(rateLimit('ip-e', 1, 1_000)).toBe(true)
  })
})
