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

-- Reservas de mesa que llegan desde la web (el cliente solo puede crearlas; el local las gestiona en el backoffice).
CREATE TABLE IF NOT EXISTS reservas (
  id         bigserial PRIMARY KEY,
  nombre     text NOT NULL,
  fecha      date NOT NULL,
  hora       text NOT NULL,
  personas   int NOT NULL,
  estado     text NOT NULL DEFAULT 'pendiente',
  creada     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reservas_fecha_idx ON reservas (fecha, hora);

-- Reseñas que se muestran en la web, editables desde el backoffice.
CREATE TABLE IF NOT EXISTS resenas (
  id       bigserial PRIMARY KEY,
  autor    text NOT NULL,
  texto    text NOT NULL,
  estrellas int,
  visible  boolean NOT NULL DEFAULT true,
  creada   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meta (key text PRIMARY KEY);

-- Carga inicial de reseñas, una sola vez (aunque después se borren todas, no vuelven).
WITH marca AS (INSERT INTO meta (key) VALUES ('resenas-inicial') ON CONFLICT DO NOTHING RETURNING 1)
INSERT INTO resenas (autor, texto)
SELECT v.autor, v.texto FROM (VALUES
    ('Gabriela Valcelli', 'Nos sorprendió este lugar lo rico que se come, encontramos que en el cerro hacen cosas con mollejas de lo que somos fans. Pedimos pizza de molleja, sándwich de mollejas y los sándwiches de entraña terribleeee'),
    ('Fede Morales Rampulla', 'Muy buena atención y mucho mejor sus sandwiches que está de más decir son abundantes, ricos, tiernos!'),
    ('Juan Manuel Arroyo', 'Hermoso lugar para compartir un lindo momento y desayunar, merendar o cenar algo muy rico.
Totalmente recomendable!!'),
    ('Rosario Concioni', 'Excelente lugar para ir a almorzar, los menu ejecutivos son abundantes y muy ricos, y el precio es muy razonable! La atención excelente'),
    ('ceci ceci', 'Muy rico los menúes
Pedimos matambre muy rico, ravioles súper caseros, milanesa....
El lugar es muy agradable
Sirven rápido
La atención es excelente todos muy atentos!'),
    ('Eleonora Valvasori', 'Excelentes todos los platos, abundantes, ricos, y precios acordes. Atención muy amable. El baño limpio tiene cambiador cómodo (si hay niños o bebés). Súper!'),
    ('Eugenia', 'Excelente atención!! Muy buena la promo de la pizza los domingos.
Muy ricos los postres.'),
    ('Florencia Elena Gomez', 'Muy rico el lomo, buena atención. Lugar limpio, tranquilo. Me gusto')
) AS v(autor, texto) WHERE EXISTS (SELECT 1 FROM marca);
`
