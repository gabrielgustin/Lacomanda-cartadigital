export const formatPrice = (amount: number) =>
  `$${amount.toLocaleString('es-AR', { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 })}`

// Minúsculas y sin tildes, para que "cafe" encuentre "café" y "pina" encuentre "piña".
export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// Armado a mano (no toLocaleString) para que servidor y navegador den el mismo texto.
export const formatOrderDate = (iso: string): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`
}
