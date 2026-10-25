# Carta digital — La Comanda

Carta digital con pedidos. El cliente mira la carta, arma su pedido y lo cierra de dos formas:

- **Para comer en el salón:** se muestra un resumen para el mozo. No se guarda ni se envía nada.
- **Para llevar:** carga sus datos, elige medio de pago (y cupón si tiene), confirma y recibe un enlace de seguimiento (`/pedido/<token>`) que se actualiza solo.

El dueño administra todo desde el **backoffice** (`/backoffice`).

Stack: Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · zod · vitest.

## Cómo correrlo

```bash
cp .env.example .env.local   # y completá BACKOFFICE_USER / BACKOFFICE_PASSWORD
pnpm install
pnpm dev                     # http://localhost:3000
```

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm test` | Tests (vitest) |
| `npx tsc --noEmit` | Chequeo de tipos. **Es el único control real**: `next.config.mjs` tiene `ignoreBuildErrors: true`, así que `next build` no detecta errores de tipos |
| `pnpm build` | Build de producción |

## Backoffice

Entrada en `/backoffice/login`, con el usuario y la contraseña de `.env.local`. Si `BACKOFFICE_PASSWORD` no está definida, **nadie puede entrar**.

- **Pedidos:** lista de los últimos 200, filtros (en curso, todos, entregados, cancelados), cambio de estado (el cliente lo ve en su seguimiento), botón para escribirle por WhatsApp y para ver el pedido como lo ve el cliente. Se actualiza cada 30 s con la pestaña visible.
- **Carta:** categorías, platos, precios, imágenes.
- **Personaliza tu App:** colores, tipografías, textos, logo.
- **Horarios:** por día, con segundo tramo y opción "aceptar pedidos fuera de horario".
- **Medios de pago, cupones y datos del negocio.**
- **Código QR** de la carta.

## Reglas de negocio y seguridad

- **El navegador nunca decide un precio.** Del cliente solo se aceptan ids, cantidades, comentarios, datos de contacto, medio de pago y código de cupón. El servidor recalcula precios, descuento y total con la carta vigente (`buildOrder` en `lib/orders.ts`, con tests).
- La regla "¿se toman pedidos ahora?" es una sola (`acceptsOrdersAt` en `lib/settings.ts`) y la usan el checkout y la API.
- Los cupones nunca viajan al navegador. `/api/coupons/validate` solo confirma un código y responde igual si es inexistente, vencido o inactivo.
- Todas las rutas, páginas y acciones del backoffice verifican la sesión en el servidor.
- Límite de pedidos y de pruebas de cupón por IP (`lib/rate-limit.ts`).
- Cada pedido guarda nombre y precio tal como eran al comprar.

## Dónde se guarda todo

Hoy en archivos dentro de `data/` (ignorada por git):

| Archivo | Contenido | Módulo que lo maneja |
| --- | --- | --- |
| `data/store.json` | Carta, tema, horarios, medios de pago, cupones, datos del negocio | `lib/store.ts` |
| `data/orders.json` | Pedidos | `lib/orders.ts` |
| `data/uploads/` | Imágenes subidas | `app/api/backoffice/upload`, `app/media` |

## Pendiente antes de publicar pedidos reales

**Vercel es de solo lectura**: ahí se puede leer, pero no guardar. En producción hoy no se pueden confirmar pedidos ni guardar cambios del backoffice. Hay que pasar el guardado a una base de datos (Neon/Postgres) y las imágenes a un almacenamiento de objetos (Vercel Blob).

La persistencia está aislada en `lib/store.ts` y `lib/orders.ts` para que la migración no toque el resto. Además:

- El límite por IP es en memoria y no es estricto en serverless: con tráfico real, usar Redis/Upstash.
- En Vercel hay que cargar `BACKOFFICE_USER` y `BACKOFFICE_PASSWORD` (una clave larga) y volver a desplegar.
- Si el chequeo de tipos queda en cero, conviene quitar `ignoreBuildErrors` de `next.config.mjs`.
