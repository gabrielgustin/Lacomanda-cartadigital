import { describe, expect, it } from 'vitest'
import { scheduleRows } from '@/lib/schedule'

describe('scheduleRows', () => {
  const horarios = Array.from({ length: 7 }, () => [] as { desde: string; hasta: string }[])
  horarios[1] = [{ desde: '12:00', hasta: '15:30' }]
  horarios[2] = [{ desde: '12:00', hasta: '15:30' }, { desde: '20:00', hasta: '00:30' }]

  it('va de lunes a domingo y marca los días cerrados', () => {
    const rows = scheduleRows(horarios, 'es')
    expect(rows.map((row) => row.name)[0]).toBe('Lunes')
    expect(rows[6].name).toBe('Domingo')
    expect(rows[0].text).toBe('12:00 a 15:30 hs')
    expect(rows[1].text).toBe('12:00 a 15:30 y 20:00 a 00:30 hs')
    expect(rows[2].text).toBe('Cerrado')
  })
})
