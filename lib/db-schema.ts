// Sin imports: lo usan la app (lib/db.ts) y el script scripts/db-setup.ts.
// Todo es idempotente (IF NOT EXISTS): se puede ejecutar en cada arranque sin riesgo.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS store (
  id         int PRIMARY KEY CHECK (id = 1),
  data       jsonb NOT NULL,
  version    int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media (
  name         text PRIMARY KEY,
  content_type text NOT NULL,
  bytes        bytea NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
`
