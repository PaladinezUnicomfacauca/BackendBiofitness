const db = require("../config/connection");

class Manager {
  // Validar datos del manager (sin validación de contraseña)
  static validate(data) {
    const errors = [];

    if (!data.name_manager) {
      errors.push("El nombre es requerido");
    }

    if (!data.email) {
      errors.push("El email es requerido");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("El email no es válido");
    }

    // No validamos password aquí
    return errors;
  }

  // Obtener todos los managers
  static async findAll() {
    const query = "SELECT * FROM managers WHERE status = true";
    const result = await db.query(query);
    return result.rows;
  }

  // Obtener un manager por ID
  static async findById(id) {
    const query =
      "SELECT * FROM managers WHERE id_manager = $1 AND status = true";
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Crear un nuevo manager (sin hash de password)
  static async create(data) {
    const query = `
            INSERT INTO managers (name_manager, email, password, status)
            VALUES ($1, $2, $3, true)
            RETURNING *
        `;
    const values = [data.name_manager, data.email, data.password];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Actualizar un manager (sin hash de password)
  static async update(id, data) {
    const manager = await this.findById(id);
    if (!manager) return null;

    let query = "UPDATE managers SET ";
    const values = [];
    let paramCount = 1;

    if (data.name_manager) {
      query += `name_manager = $${paramCount}, `;
      values.push(data.name_manager);
      paramCount++;
    }

    if (data.email) {
      query += `email = $${paramCount}, `;
      values.push(data.email);
      paramCount++;
    }

    if (data.password) {
      query += `password = $${paramCount}, `;
      values.push(data.password);
      paramCount++;
    }

    // Remover la última coma y espacio
    query = query.slice(0, -2);

    query += ` WHERE id_manager = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Eliminar un manager (soft delete)
  static async delete(id) {
    const query =
      "UPDATE managers SET status = false WHERE id_manager = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Obtener membresías registradas por un manager
  static async getMemberships(id) {
    const query = `
            SELECT m.*, u.name_user, p.name_plan
            FROM memberships m
            JOIN users u ON m.id_user = u.id_user
            JOIN plans p ON m.id_plan = p.id_plan
            WHERE m.id_manager = $1 AND m.status = true
        `;
    const result = await db.query(query, [id]);
    return result.rows;
  }
}

module.exports = Manager;
