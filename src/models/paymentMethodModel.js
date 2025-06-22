import pool from "../config/connection.js";

class PaymentMethod {
  // Obtener todos los métodos de pago
  static async findAll() {
    const result = await pool.query("SELECT * FROM payment_methods");
    return result.rows;
  }

  // Obtener un método de pago por ID
  static async findById(id) {
    const result = await pool.query(
      "SELECT * FROM payment_methods WHERE id_method = $1",
      [id]
    );
    return result.rows[0];
  }

  // Crear un nuevo método de pago
  static async create(methodData) {
    const { name_method } = methodData;
    const result = await pool.query(
      "INSERT INTO payment_methods (name_method) VALUES ($1) RETURNING *",
      [name_method]
    );
    return result.rows[0];
  }

  // Actualizar un método de pago
  static async update(id, methodData) {
    const { name_method } = methodData;
    const result = await pool.query(
      "UPDATE payment_methods SET name_method = $1 WHERE id_method = $2 RETURNING *",
      [name_method, id]
    );
    return result.rows[0];
  }

  // Eliminar un método de pago
  static async delete(id) {
    const result = await pool.query(
      "DELETE FROM payment_methods WHERE id_method = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  // Obtener membresías de un método de pago
  static async getMemberships(id) {
    const result = await pool.query(
      `SELECT m.*, u.name_user, p.days_duration, p.price, pm.name_method, e.name_estate 
             FROM memberships m
             JOIN users u ON m.id_user = u.id_user
             JOIN plans p ON m.id_plan = p.id_plan
             JOIN payment_methods pm ON m.id_method = pm.id_method
             JOIN estates e ON m.id_estate = e.id_estate
             WHERE m.id_method = $1`,
      [id]
    );
    return result.rows;
  }

  // Validar datos del método de pago
  static validate(methodData) {
    const errors = [];

    if (!methodData.name_method) {
      errors.push("El nombre del método de pago es requerido");
    } else if (methodData.name_method.length > 13) {
      errors.push(
        "El nombre del método de pago no puede tener más de 13 caracteres"
      );
    }

    return errors;
  }
}

export default PaymentMethod;
