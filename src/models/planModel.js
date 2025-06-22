import pool from "../config/connection.js";

class Plan {
  // Obtener todos los planes
  static async findAll() {
    const result = await pool.query("SELECT * FROM plans");
    return result.rows;
  }

  // Obtener un plan por ID
  static async findById(id) {
    const result = await pool.query("SELECT * FROM plans WHERE id_plan = $1", [
      id,
    ]);
    return result.rows[0];
  }

  // Crear un nuevo plan
  static async create(planData) {
    const { days_duration, price } = planData;
    const result = await pool.query(
      "INSERT INTO plans (days_duration, price) VALUES ($1, $2) RETURNING *",
      [days_duration, price]
    );
    return result.rows[0];
  }

  // Actualizar un plan
  static async update(id, planData) {
    const { days_duration, price } = planData;
    const result = await pool.query(
      "UPDATE plans SET days_duration = $1, price = $2 WHERE id_plan = $3 RETURNING *",
      [days_duration, price, id]
    );
    return result.rows[0];
  }

  // Eliminar un plan
  static async delete(id) {
    const result = await pool.query(
      "DELETE FROM plans WHERE id_plan = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  // Obtener membresías de un plan
  static async getMemberships(id) {
    const result = await pool.query(
      `SELECT m.*, u.name_user, p.days_duration, p.price, pm.name_method, e.name_estate 
             FROM memberships m
             JOIN users u ON m.id_user = u.id_user
             JOIN plans p ON m.id_plan = p.id_plan
             JOIN payment_methods pm ON m.id_method = pm.id_method
             JOIN estates e ON m.id_estate = e.id_estate
             WHERE m.id_plan = $1`,
      [id]
    );
    return result.rows;
  }

  // Validar datos del plan
  static validate(planData) {
    const errors = [];

    if (!planData.days_duration) {
      errors.push("La duración en días es requerida");
    } else if (planData.days_duration <= 0) {
      errors.push("La duración debe ser mayor a 0 días");
    }

    if (!planData.price) {
      errors.push("El precio es requerido");
    } else if (planData.price <= 0) {
      errors.push("El precio debe ser mayor a 0");
    }

    return errors;
  }
}

export default Plan;
