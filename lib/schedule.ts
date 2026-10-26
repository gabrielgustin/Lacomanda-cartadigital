import type { Tramo } from '@/lib/settings'

const DAY_NAMES = {
  es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}
const WORDS = { es: { to: 'a', and: 'y', closed: 'Cerrado', hs: 'hs' }, en: { to: 'to', and: 'and', closed: 'Closed', hs: '' } }

/** Filas de lunes a domingo para mostrar. `horarios` viene indexado por getDay() (0 = domingo). */
export function scheduleRows(horarios: Tramo[][], lang: 'es' | 'en') {
  const w = WORDS[lang]
  return [1, 2, 3, 4, 5, 6, 0].map((day, position) => ({
    day,
    name: DAY_NAMES[lang][position],
    text: horarios[day]?.length
      ? horarios[day].map((tramo) => `${tramo.desde} ${w.to} ${tramo.hasta}`).join(` ${w.and} `) + (w.hs ? ` ${w.hs}` : '')
      : w.closed,
  }))
}
