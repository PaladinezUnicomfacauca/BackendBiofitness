import { pool } from "../db/conn.js";

const REQUIRED_STATES = ["Vigente", "Por vencer", "Vencido"];

/** Una sola consulta UPDATE en lote (sin for en Node). */
const BULK_UPDATE_SQL = `
WITH state_ids AS (
  SELECT
    MAX(id_state) FILTER (WHERE name_state = 'Vigente') AS vigente_id,
    MAX(id_state) FILTER (WHERE name_state = 'Por vencer') AS por_vencer_id,
    MAX(id_state) FILTER (WHERE name_state = 'Vencido') AS vencido_id
  FROM states
  WHERE name_state IN ('Vigente', 'Por vencer', 'Vencido')
),
computed AS (
  SELECT
    m.id_membership,
    (m.expiration_date - CURRENT_DATE) AS days_until,
    m.id_state AS current_state,
    m.days_arrears AS current_arrears,
    s.vigente_id,
    s.por_vencer_id,
    s.vencido_id
  FROM memberships m
  CROSS JOIN state_ids s
),
next_values AS (
  SELECT
    id_membership,
    CASE
      WHEN days_until > 5 THEN vigente_id
      WHEN days_until >= 0 THEN por_vencer_id
      ELSE vencido_id
    END AS new_id_state,
    CASE
      WHEN days_until < 0 THEN ABS(days_until)
      ELSE 0
    END AS new_days_arrears,
    current_state,
    current_arrears
  FROM computed
)
UPDATE memberships m
SET
  id_state = nv.new_id_state,
  days_arrears = nv.new_days_arrears
FROM next_values nv
WHERE m.id_membership = nv.id_membership
  AND (
    m.id_state IS DISTINCT FROM nv.new_id_state
    OR m.days_arrears IS DISTINCT FROM nv.new_days_arrears
  )
RETURNING m.id_membership;
`;

async function assertRequiredStatesExist(db) {
  const { rows } = await db.query(
    `SELECT name_state FROM states WHERE name_state = ANY($1::text[])`,
    [REQUIRED_STATES]
  );
  if (rows.length !== REQUIRED_STATES.length) {
    const found = new Set(rows.map((r) => r.name_state));
    const missing = REQUIRED_STATES.filter((name) => !found.has(name));
    throw new Error(`Estados no encontrados en la BD: ${missing.join(", ")}`);
  }
}

/**
 * Actualiza en lote todas las membresías (1 round-trip a PostgreSQL).
 * @param {import('pg').Pool | import('pg').PoolClient} [db=pool]
 */
export async function bulkUpdateAllMembershipStates(db = pool) {
  await assertRequiredStatesExist(db);

  const { rows } = await db.query(BULK_UPDATE_SQL);
  return { updatedCount: rows.length };
}

/**
 * Calcula estado y mora para una membresía (alta/renovación manual).
 * Para muchas filas usar bulkUpdateAllMembershipStates.
 */
export async function calculateStateAndArrears(expirationDate, db = pool) {
  const { rows } = await db.query(
    `
    WITH input AS (
      SELECT $1::date AS expiration_date
    ),
    calc AS (
      SELECT (expiration_date - CURRENT_DATE) AS days_until
      FROM input
    )
    SELECT
      CASE
        WHEN days_until > 5 THEN (SELECT id_state FROM states WHERE name_state = 'Vigente')
        WHEN days_until >= 0 THEN (SELECT id_state FROM states WHERE name_state = 'Por vencer')
        ELSE (SELECT id_state FROM states WHERE name_state = 'Vencido')
      END AS id_state,
      CASE
        WHEN days_until < 0 THEN ABS(days_until)
        ELSE 0
      END AS days_arrears
    FROM calc
    `,
    [expirationDate]
  );

  if (!rows[0]?.id_state) {
    throw new Error("No se pudo resolver el estado de la membresía");
  }

  return rows[0];
}
