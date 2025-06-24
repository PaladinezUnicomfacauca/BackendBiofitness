import { pool } from "../db/conn.js";

export const getManagers = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM managers ORDER BY id_manager ASC");
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getManagerById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validar que el ID sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid manager ID" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM managers WHERE id_manager = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Manager not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createManager = async (req, res) => {
  try {
    const { name_manager, phone, email, password } = req.body;

    // Verificar que el teléfono no esté duplicado
    const phoneCheck = await pool.query(
      "SELECT id_manager FROM managers WHERE phone = $1",
      [phone]
    );

    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    // Verificar que el email no esté duplicado
    const emailCheck = await pool.query(
      "SELECT id_manager FROM managers WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const { rows } = await pool.query(
      "INSERT INTO managers (name_manager, phone, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [name_manager, phone, email, password]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateManager = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name_manager, phone, email, password } = req.body;

    // Verificar que el manager existe
    const managerCheck = await pool.query(
      "SELECT id_manager FROM managers WHERE id_manager = $1",
      [id]
    );

    if (managerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Manager not found" });
    }

    // Si se está actualizando el teléfono, verificar que no esté duplicado
    if (phone) {
      const phoneCheck = await pool.query(
        "SELECT id_manager FROM managers WHERE phone = $1 AND id_manager != $2",
        [phone, id]
      );

      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: "Phone number already exists" });
      }
    }

    // Si se está actualizando el email, verificar que no esté duplicado
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id_manager FROM managers WHERE email = $1 AND id_manager != $2",
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Construir la consulta dinámicamente basada en los campos proporcionados
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (name_manager !== undefined) {
      updateFields.push(`name_manager = $${paramCount}`);
      values.push(name_manager);
      paramCount++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (password !== undefined) {
      updateFields.push(`password = $${paramCount}`);
      values.push(password);
      paramCount++;
    }

    // Agregar updated_at y el id del manager
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE managers SET ${updateFields.join(', ')} WHERE id_manager = $${paramCount} RETURNING *`,
      values
    );

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteManager = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Verificar que el manager no tenga usuarios asociados
    const usersCheck = await pool.query(
      "SELECT id_user FROM users WHERE id_manager = $1",
      [id]
    );

    if (usersCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete manager. There are users associated with this manager. Please reassign users first." 
      });
    }

    const { rowCount } = await pool.query(
      "DELETE FROM managers WHERE id_manager = $1",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Manager not found" });
    }

    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
