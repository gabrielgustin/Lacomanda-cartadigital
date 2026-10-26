// Convierte un teléfono argentino al formato internacional de wa.me (549 + código de área + número).
export const toWhatsAppNumber = (phone: string): string | null => {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('54')) {
    digits = digits.slice(2)
    if (digits.startsWith('9')) digits = digits.slice(1)
  }
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 12) {
    // El "15" móvil aparece después del código de área (2, 3 o 4 dígitos).
    for (const idx of [2, 3, 4]) {
      if (digits.substring(idx, idx + 2) === '15') {
        digits = digits.slice(0, idx) + digits.slice(idx + 2)
        break
      }
    }
  }
  return digits.length === 10 ? '549' + digits : null
}

export const waLink = (phone: string, text: string): string | null => {
  const number = toWhatsAppNumber(phone)
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null
}

interface MessageOrder {
  clienteNombre: string
  clienteTelefono: string
  formaEntrega: string
  direccion: string | null
  notas: string | null
  metodoPago: string | null
  cupon: string | null
  subtotal: number
  descuento: number
  total: number
  items: { nombre: { es: string }; precioUnitario: number; cantidad: number }[]
}

const money = (amount: number) => `$${amount.toLocaleString('es-AR')}`

/** Texto predeterminado del pedido que se abre en WhatsApp. Siempre en español: lo lee el local. */
export function orderMessage(order: MessageOrder): string {
  const lines = [
    '*Nuevo pedido - La Comanda*',
    '',
    ...order.items.map((item) => `${item.cantidad} x ${item.nombre.es} - ${money(item.precioUnitario * item.cantidad)}`),
    '',
  ]
  if (order.descuento > 0) lines.push(`Subtotal: ${money(order.subtotal)}`, `Descuento${order.cupon ? ` (${order.cupon})` : ''}: -${money(order.descuento)}`)
  lines.push(`*Total: ${money(order.total)}*`, '')
  lines.push(`Entrega: ${order.formaEntrega}`)
  if (order.direccion) lines.push(`Dirección: ${order.direccion}`)
  if (order.metodoPago) lines.push(`Pago: ${order.metodoPago}`)
  lines.push(`Nombre: ${order.clienteNombre}`, `Teléfono: ${order.clienteTelefono}`)
  if (order.notas) lines.push(`Comentarios: ${order.notas}`)
  return lines.join('\n')
}
