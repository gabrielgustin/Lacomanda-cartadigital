@AGENTS.md

## Herramientas del proyecto
- Antes de buscar archivo por archivo, consultá el mapa: `graphify query "<pregunta>"`; leé el código solo en las líneas que indique.
- Al terminar una tarea que cambió código, corré `graphify update .` (no después de cada cambio).
- Pantallas y componentes: usá la skill `frontend-design` si está disponible; si no, `agent-skills:frontend-ui-engineering`. Respetá los tokens y el estilo de la app.
- Playwright solo para probar interfaces, no para cambiar código.
- Respuestas breves.
- No ejecutes planes completos de forma autónoma ni "/build auto" salvo que se pida.
- Precios: el navegador nunca los define; el servidor los recalcula desde la carta (`buildOrder` en `lib/orders.ts`).
- Antes de dar algo por terminado: `npx tsc --noEmit` y `pnpm test`.
