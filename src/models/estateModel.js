import db from "../config/connection.js";

class Estate {
  // Validar datos del estate
  static validate(data) {
    const errors = [];

    if (!data.name_estate) {
      errors.push("El nombre del estado es requerido");
    } else if (data.name_estate.length > 10) {
      errors.push("El nombre del estado no puede exceder 10 caracteres");
    }

    return errors;
  }

  // Obtener todos los estates
  static async findAll() {
    const query = "SELECT * FROM estates ORDER BY name_estate";
    const result = await db.query(query);
    return result.rows;
  }

  // Obtener un estate por ID
  static async findById(id) {
    const query = "SELECT * FROM estates WHERE id_estate = $1";
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Crear un nuevo estate
  static async create(data) {
    const query = `
      INSERT INTO estates (name_estate)
      VALUES ($1)
      RETURNING *
    `;
    const result = await db.query(query, [data.name_estate]);
    return result.rows[0];
  }

  // Actualizar un estate
  static async update(id, data) {
    const estate = await this.findById(id);
    if (!estate) return null;

    const query = `
      UPDATE estates 
      SET name_estate = $1
      WHERE id_estate = $2 
      RETURNING *
    `;
    const result = await db.query(query, [data.name_estate, id]);
    return result.rows[0];
  }

  // Eliminar un estate
  static async delete(id) {
    // Verificar si hay membresías que usan este estate
    const checkQuery = "SELECT COUNT(*) FROM memberships WHERE id_estate = $1";
    const checkResult = await db.query(checkQuery, [id]);

    if (parseInt(checkResult.rows[0].count) > 0) {
      throw new Error(
        "No se puede eliminar el estado porque está siendo usado por membresías"
      );
    }

    const query = "DELETE FROM estates WHERE id_estate = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Buscar estate por nombre
  static async findByName(name) {
    const query = "SELECT * FROM estates WHERE name_estate ILIKE $1";
    const result = await db.query(query, [`%${name}%`]);
    return result.rows;
  }
}

export default Estate;
