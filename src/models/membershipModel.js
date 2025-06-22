import pool from "../config/connection.js";

class Membership {
  // Obtener todas las membresías
  static async findAll() {
    const result = await pool.query(
      `SELECT m.*, u.name_user, p.days_duration, p.price, pm.name_method, e.name_estate 
             FROM memberships m
             JOIN users u ON m.id_user = u.id_user
             JOIN plans p ON m.id_plan = p.id_plan
             JOIN payment_methods pm ON m.id_method = pm.id_method
             JOIN estates e ON m.id_estate = e.id_estate`
    );
    return result.rows;
  }

  // Obtener una membresía por ID
  static async findById(id) {
    const result = await pool.query(
      `SELECT m.*, u.name_user, p.days_duration, p.price, pm.name_method, e.name_estate 
             FROM memberships m
             JOIN users u ON m.id_user = u.id_user
             JOIN plans p ON m.id_plan = p.id_plan
             JOIN payment_methods pm ON m.id_method = pm.id_method
             JOIN estates e ON m.id_estate = e.id_estate
             WHERE m.id_membership = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Crear una nueva membresía
  static async create(membershipData) {
    const {
      last_payment,
      amount_paid,
      expiration_date,
      receipt_number,
      id_user,
      id_plan,
      id_method,
      id_manager,
      id_estate,
    } = membershipData;

    const result = await pool.query(
      `INSERT INTO memberships (
                last_payment, amount_paid, expiration_date, receipt_number,
                id_user, id_plan, id_method, id_manager, id_estate
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        last_payment,
        amount_paid,
        expiration_date,
        receipt_number,
        id_user,
        id_plan,
        id_method,
        id_manager,
        id_estate,
      ]
    );
    return result.rows[0];
  }

  // Actualizar una membresía
  static async update(id, membershipData) {
    const {
      last_payment,
      amount_paid,
      expiration_date,
      receipt_number,
      id_plan,
      id_method,
      id_estate,
    } = membershipData;

    const result = await pool.query(
      `UPDATE memberships 
             SET last_payment = $1, amount_paid = $2, expiration_date = $3,
                 receipt_number = $4, id_plan = $5, id_method = $6, id_estate = $7
             WHERE id_membership = $8 RETURNING *`,
      [
        last_payment,
        amount_paid,
        expiration_date,
        receipt_number,
        id_plan,
        id_method,
        id_estate,
        id,
      ]
    );
    return result.rows[0];
  }

  // Eliminar una membresía
  static async delete(id) {
    const result = await pool.query(
      "DELETE FROM memberships WHERE id_membership = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  // Obtener membresías por vencer
  static async findExpiring() {
    const result = await pool.query(
      `SELECT m.*, u.name_user, p.days_duration, p.price, pm.name_method, e.name_estate 
             FROM memberships m
             JOIN users u ON m.id_user = u.id_user
             JOIN plans p ON m.id_plan = p.id_plan
             JOIN payment_methods pm ON m.id_method = pm.id_method
             JOIN estates e ON m.id_estate = e.id_estate
             WHERE m.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`
    );
    return result.rows;
  }

  // Obtener membresías vencidas
  static async findExpired() {
    const result = await pool.query(
      `SELECT m.*, u.name_user, p.days_duration, p.price, pm.name_method, e.name_estate 
             FROM memberships m
             JOIN users u ON m.id_user = u.id_user
             JOIN plans p ON m.id_plan = p.id_plan
             JOIN payment_methods pm ON m.id_method = pm.id_method
             JOIN estates e ON m.id_estate = e.id_estate
             WHERE m.expiration_date < CURRENT_DATE`
    );
    return result.rows;
  }

  // Obtener membresías activas
  static async findActive() {
    const result = await pool.query(
      `SELECT m.*, u.name_user, p.days_duration, p.price, pm.name_method, e.name_estate 
             FROM memberships m
             JOIN users u ON m.id_user = u.id_user
             JOIN plans p ON m.id_plan = p.id_plan
             JOIN payment_methods pm ON m.id_method = pm.id_method
             JOIN estates e ON m.id_estate = e.id_estate
             WHERE m.expiration_date >= CURRENT_DATE`
    );
    return result.rows;
  }

  // Validar datos de la membresía
  static validate(membershipData) {
    const errors = [];

    if (!membershipData.last_payment) {
      errors.push("La fecha de último pago es requerida");
    }

    if (!membershipData.amount_paid) {
      errors.push("El monto pagado es requerido");
    } else if (membershipData.amount_paid <= 0) {
      errors.push("El monto pagado debe ser mayor a 0");
    }

    if (!membershipData.expiration_date) {
      errors.push("La fecha de expiración es requerida");
    }

    if (!membershipData.receipt_number) {
      errors.push("El número de recibo es requerido");
    }

    if (!membershipData.id_user) {
      errors.push("El ID del usuario es requerido");
    }

    if (!membershipData.id_plan) {
      errors.push("El ID del plan es requerido");
    }

    if (!membershipData.id_method) {
      errors.push("El ID del método de pago es requerido");
    }

    if (!membershipData.id_manager) {
      errors.push("El ID del manager es requerido");
    }

    if (!membershipData.id_estate) {
      errors.push("El ID del estado es requerido");
    }

    return errors;
  }
}

export default Membership;
