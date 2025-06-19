const pool = require("../config/connection");

class User {
  // Obtener todos los usuarios
  static async findAll() {
    const result = await pool.query("SELECT * FROM users");
    return result.rows;
  }

  // Obtener un usuario por ID
  static async findById(id) {
    const result = await pool.query("SELECT * FROM users WHERE id_user = $1", [
      id,
    ]);
    return result.rows[0];
  }

  // Crear un nuevo usuario
  static async create(userData) {
    const { name_user, phone } = userData;
    const result = await pool.query(
      "INSERT INTO users (name_user, phone) VALUES ($1, $2) RETURNING *",
      [name_user, phone]
    );
    return result.rows[0];
  }

  // Actualizar un usuario
  static async update(id, userData) {
    const { name_user, phone } = userData;
    const result = await pool.query(
      "UPDATE users SET name_user = $1, phone = $2, updated_at = CURRENT_TIMESTAMP WHERE id_user = $3 RETURNING *",
      [name_user, phone, id]
    );
    return result.rows[0];
  }

  // Eliminar un usuario
  static async delete(id) {
    const result = await pool.query(
      "DELETE FROM users WHERE id_user = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }

  // Obtener membresías de un usuario
  static async getMemberships(id) {
    const result = await pool.query(
      `SELECT m.*, p.days_duration, p.price, pm.name_method, e.name_estate 
             FROM memberships m
             JOIN plans p ON m.id_plan = p.id_plan
             JOIN payment_methods pm ON m.id_method = pm.id_method
             JOIN estates e ON m.id_estate = e.id_estate
             WHERE m.id_user = $1`,
      [id]
    );
    return result.rows;
  }

  // Validar datos del usuario
  static validate(userData) {
    const errors = [];

    if (!userData.name_user) {
      errors.push("El nombre es requerido");
    } else if (userData.name_user.length > 40) {
      errors.push("El nombre no puede tener más de 40 caracteres");
    }

    if (!userData.phone) {
      errors.push("El teléfono es requerido");
    } else if (!/^\d{10}$/.test(userData.phone)) {
      errors.push("El teléfono debe tener 10 dígitos");
    }

    return errors;
  }
}

module.exports = User;
