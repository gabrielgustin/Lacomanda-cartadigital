# Carta digital — La Comanda

Carta digital con pedidos. El cliente mira la carta, arma su pedido y lo cierra de dos formas:

- **Para comer en el salón:** se muestra un resumen para el mozo. No se guarda ni se envía nada.
- **Para llevar / delivery:** carga sus datos (y la dirección si es delivery), elige medio de pago (y cupón si tiene) y al confirmar se abre WhatsApp con el pedido armado. No se guarda nada: el servidor valida y recalcula los precios y arma el mensaje (`lib/whatsapp.ts`). Con el local cerrado y delivery elegido, se muestran los horarios de atención.

El dueño administra todo desde el **backoffice** (`/backoffice`).

Stack: Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · zod · vitest.

## Cómo correrlo

```bash
cp .env.example .env.local   # completá BACKOFFICE_USER, BACKOFFICE_PASSWORD y DATABASE_URL
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

## Dónde se guarda todo

Todo vive en **Postgres (Neon)**, conectado con `DATABASE_URL`. Las tablas se crean solas la primera vez que la app se conecta.

| Tabla | Contenido | Módulo |
| --- | --- | --- |
| `store` | Una sola fila (jsonb): carta, tema, horarios, medios de pago, cupones y datos del negocio | `lib/store.ts` |
| `media` | Imágenes subidas desde el backoffice (hasta 3 MB) | `app/api/backoffice/upload`, `app/media` |

- **Edición simultánea:** cada guardado de la carta sube un número de versión; si dos personas guardan a la vez, el segundo reintenta sobre lo nuevo y no se pisan.
- **Si la base no responde:** la carta pública muestra la carta base (no se rompe), pero armar un pedido y los guardados **fallan con un error claro y no escriben nada**. El backoffice usa siempre lectura estricta, para que nunca se guarde algo armado sobre la carta base.
- **Sin base configurada** (`DATABASE_URL` vacía) pasa lo mismo: la carta base se ve y nada se puede guardar.

### Ramas de Neon

| Rama | Quién la usa |
| --- | --- |
| `main` (producción) | Vercel, variable `DATABASE_URL` del entorno **Production** |
| `dev` | Tu `.env.local`. **No uses la URL de producción en local ni en las previews de Vercel.** |

### Primera vez / importar tus datos locales

```bash
pnpm db:setup            # crea las tablas e importa data/store.json, data/orders.json y data/uploads si existen
pnpm db:setup --dry-run  # muestra qué haría, sin escribir
pnpm db:setup --force    # reemplaza la carta de la base por data/store.json
```

Para producción, pasá su URL de forma explícita (no queda guardada en ningún archivo):

```bash
DATABASE_URL="postgresql://..." node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/db-setup.mts
```

El script no pisa una carta que ya esté en la base salvo que uses `--force`, y si algo falla deshace todo.

### Tests con base real

`pnpm test` corre solo los tests puros. Los de integración contra Postgres (edición simultánea, imágenes) se activan con una base **local** (se vacía al correr):

```bash
TEST_DATABASE_URL="postgresql://usuario@127.0.0.1:5432/prueba" pnpm test
```

## Pendiente

- El límite de intentos por IP (pedidos, cupones, login) cuenta en memoria de cada instancia: no es estricto en Vercel. Con tráfico real, pasarlo a Redis/Upstash.
- En Vercel hay que cargar `BACKOFFICE_USER` y `BACKOFFICE_PASSWORD` (una clave larga) y volver a desplegar.
- Si el chequeo de tipos queda en cero, conviene quitar `ignoreBuildErrors` de `next.config.mjs`.
