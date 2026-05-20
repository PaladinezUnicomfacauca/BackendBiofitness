-- Índices recomendados para Biofitness (ejecutar una vez en BD existente).
-- En PostgreSQL local o Railway: psql $DATABASE_URL -f src/db/indexes.sql

-- Actualización masiva de estados (expiration_date - CURRENT_DATE)
CREATE INDEX IF NOT EXISTS idx_memberships_expiration_date
  ON memberships (expiration_date);

-- Limpieza por mora (days_arrears > 20) y filtros de mora
CREATE INDEX IF NOT EXISTS idx_memberships_days_arrears
  ON memberships (days_arrears)
  WHERE days_arrears > 0;

-- DELETE / JOIN por usuario (membresías y borrados en cascada manual)
CREATE INDEX IF NOT EXISTS idx_memberships_id_user
  ON memberships (id_user);

-- Listados por estado (Vigente, Por vencer, etc.)
CREATE INDEX IF NOT EXISTS idx_memberships_id_state
  ON memberships (id_state);

-- Huérfanos: anti-join memberships → id_user ya cubierto arriba en memberships
