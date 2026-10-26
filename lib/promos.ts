import type { Localized } from '@/lib/menu-data'

export interface Promo {
  id: string
  /** Días de la semana en que rige (0 = domingo), para resaltar la de hoy. */
  days: number[]
  day: Localized
  text: Localized
  /** Franja horaria, si la promo no rige todo el día. */
  hours?: Localized
  icon: 'sandwich' | 'users' | 'beef' | 'pizza' | 'martini' | 'beer'
}

export const promos: Promo[] = [
  {
    id: 'martes',
    days: [2],
    day: { es: 'Martes', en: 'Tuesday' },
    text: { es: 'Consumiendo dos sándwiches, el segundo sale al 50%.', en: 'Order two sandwiches and the second one is 50% off.' },
    icon: 'sandwich',
  },
  {
    id: 'miercoles',
    days: [3],
    day: { es: 'Miércoles', en: 'Wednesday' },
    text: {
      es: '15% de descuento para mesas de mujeres. Superando los $40.000, 15% en efectivo.',
      en: '15% off for tables of women. Spending over $40,000: 15% off when paying cash.',
    },
    icon: 'users',
  },
  {
    id: 'jueves',
    days: [4],
    day: { es: 'Jueves', en: 'Thursday' },
    text: { es: '2x1 en hamburguesas.', en: '2-for-1 on burgers.' },
    icon: 'beef',
  },
  {
    id: 'domingos',
    days: [0],
    day: { es: 'Domingos', en: 'Sundays' },
    text: { es: 'Consumiendo dos pizzas, la más económica al 50%.', en: 'Order two pizzas and the cheaper one is 50% off.' },
    icon: 'pizza',
  },
  {
    id: 'happy-tragos',
    days: [2, 3, 4],
    day: { es: 'Martes a jueves', en: 'Tuesday to Thursday' },
    hours: { es: 'Happy hour 17 a 20 hs', en: 'Happy hour 5 to 8 pm' },
    text: { es: '2x1 en tragos: Aperol, Campari y Fernet.', en: '2-for-1 on drinks: Aperol, Campari and Fernet.' },
    icon: 'martini',
  },
  {
    id: 'happy-chopp',
    days: [5],
    day: { es: 'Viernes', en: 'Friday' },
    hours: { es: 'Happy hour 17 a 20 hs', en: 'Happy hour 5 to 8 pm' },
    text: { es: '2x1 en chopp Stella.', en: '2-for-1 on Stella draft beer.' },
    icon: 'beer',
  },
]

export const promosCopy = {
  eyebrow: { es: 'Beneficios', en: 'Perks' },
  title: { es: 'Promos de la semana', en: 'This week’s deals' },
  today: { es: 'Hoy', en: 'Today' },
  swipe: { es: 'Deslizá para ver más promos', en: 'Swipe to see more deals' },
  next: { es: 'Ver más promos', en: 'See more deals' },
  cashOnly: {
    es: 'Todas las promos son solo en efectivo y se abonan por la totalidad de la mesa, sin excepción.',
    en: 'All deals are cash only and apply to the whole table’s bill, no exceptions.',
  },
  paymentsTitle: { es: 'Medios de pago', en: 'Payment methods' },
  surcharge: { es: '+15% de recargo', en: '+15% surcharge' },
}

export const paymentMethods: { id: string; label: Localized; icon: 'card' | 'phone' | 'credit'; note?: boolean }[] = [
  { id: 'visa-master', label: { es: 'Visa / Master', en: 'Visa / Master' }, icon: 'card' },
  { id: 'debito', label: { es: 'Débito', en: 'Debit' }, icon: 'card' },
  { id: 'mercado-pago', label: { es: 'Mercado Pago', en: 'Mercado Pago' }, icon: 'phone' },
  { id: 'credito', label: { es: 'Tarjeta de crédito', en: 'Credit card' }, icon: 'credit', note: true },
]
