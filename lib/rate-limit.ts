// shortcut: contador en memoria, no es estricto en serverless (cada instancia cuenta aparte); pasar a Redis/Upstash con tráfico real.
const hits = new Map<string, number[]>()

/** true si la petición entra; false si `key` ya hizo `max` en los últimos `windowMs`. */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  hits.set(key, [...recent, now])
  return true
}
