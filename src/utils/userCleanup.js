import { pool } from "../db/conn.js";

const DEFAULT_ARREARS_THRESHOLD = 20;

/**
 * Elimina en lote usuarios con mora > umbral y usuarios huérfanos (sin membresías).
 * Una transacción, pocas consultas; fotos Cloudinary se borran después en Node.
 */
const BULK_DELETE_USERS_SQL = `
WITH arrears_users AS (
  SELECT DISTINCT id_user
  FROM memberships
  WHERE days_arrears > $1
),
orphan_users AS (
  SELECT u.id_user
  FROM users u
  WHERE NOT EXISTS (
    SELECT 1 FROM memberships m WHERE m.id_user = u.id_user
  )
),
users_to_delete AS (
  SELECT id_user FROM arrears_users
  UNION
  SELECT id_user FROM orphan_users
),
deleted_memberships AS (
  DELETE FROM memberships m
  USING users_to_delete d
  WHERE m.id_user = d.id_user
),
deleted_users AS (
  DELETE FROM users u
  USING users_to_delete d
  WHERE u.id_user = d.id_user
  RETURNING u.id_user, u.face_public_id
)
SELECT id_user, face_public_id FROM deleted_users;
`;

/**
 * @param {import('pg').Pool | import('pg').PoolClient} db
 * @param {number} threshold
 * @returns {Promise<{ deleted: number, ids: number[], facePublicIds: string[] }>}
 */
export async function bulkDeleteUsersWithArrearsAndOrphans(
  db = pool,
  threshold = DEFAULT_ARREARS_THRESHOLD
) {
  const { rows } = await db.query(BULK_DELETE_USERS_SQL, [threshold]);
  const ids = rows.map((r) => r.id_user);
  const facePublicIds = rows
    .map((r) => r.face_public_id)
    .filter(Boolean);

  return {
    deleted: ids.length,
    ids,
    facePublicIds,
  };
}

export { DEFAULT_ARREARS_THRESHOLD };
