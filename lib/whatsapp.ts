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
