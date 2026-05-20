import { pool } from "../db/conn.js";
import { bulkUpdateAllMembershipStates } from "../utils/membershipState.js";

/**
 * Job/cron: recalcula estado y mora de todas las membresías en una sola consulta SQL.
 * @param {{ closePool?: boolean }} options - closePool solo al ejecutar el script CLI.
 */
export async function updateAllMembershipStates({ closePool = false } = {}) {
  console.log(`[${new Date().toISOString()}] Iniciando actualización de estados...`);

  const { updatedCount } = await bulkUpdateAllMembershipStates(pool);

  console.log(
    `[${new Date().toISOString()}] Actualización completada. ${updatedCount} membresías actualizadas.`
  );

  if (closePool) {
    await pool.end();
  }

  return { updatedCount };
}
