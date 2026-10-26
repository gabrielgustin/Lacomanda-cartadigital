// Sin imports: lo usan la app (lib/db.ts) y el script scripts/db-setup.ts.
// Todo es idempotente (IF NOT EXISTS): se puede ejecutar en cada arranque sin riesgo.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS store (
  id         int PRIMARY KEY CHECK (id = 1),
  data       jsonb NOT NULL,
  version    int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id               serial PRIMARY KEY,
  token            uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  estado           text NOT NULL DEFAULT 'nuevo'
                   CHECK (estado IN ('nuevo','confirmado','preparando','listo','entregado','cancelado')),
  cliente_nombre   text NOT NULL,
  cliente_telefono text NOT NULL,
  notas            text,
  forma_entrega    text NOT NULL,
  subtotal         numeric(12,2) NOT NULL,
  descuento        numeric(12,2) NOT NULL DEFAULT 0,
  cupon            text,
  metodo_pago      text,
  total            numeric(12,2) NOT NULL,
  items            jsonb NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pedidos_created_idx ON pedidos (created_at DESC);
CREATE INDEX IF NOT EXISTS pedidos_estado_idx ON pedidos (estado);

CREATE TABLE IF NOT EXISTS media (
  name         text PRIMARY KEY,
  content_type text NOT NULL,
  bytes        bytea NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
`
