import { pool } from "../db/conn.js";

export const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id_user, name_user, phone, TO_CHAR(created_at, 'YYYY-MM-DD') as created_at, TO_CHAR(updated_at, 'YYYY-MM-DD') as updated_at FROM users ORDER BY id_user DESC");
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validar que el ID sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { rows } = await pool.query(
      "SELECT id_user, name_user, phone, TO_CHAR(created_at, 'YYYY-MM-DD') as created_at, TO_CHAR(updated_at, 'YYYY-MM-DD') as updated_at FROM users WHERE id_user = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name_user, phone } = req.body;

    // Validar que el teléfono tenga exactamente 10 dígitos
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Phone number must have exactly 10 digits." });
    }

    // Verificar que el teléfono no esté duplicado
    const phoneCheck = await pool.query(
      "SELECT id_user FROM users WHERE phone = $1",
      [phone]
    );

    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    const { rows } = await pool.query(
      "INSERT INTO users (name_user, phone) VALUES ($1, $2) RETURNING *",
      [name_user, phone]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name_user, phone } = req.body;

    // Verificar que el usuario existe
    const userCheck = await pool.query(
      "SELECT id_user FROM users WHERE id_user = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Si se está actualizando el teléfono, validar que tenga exactamente 10 dígitos
    if (phone !== undefined && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Phone number must have exactly 10 digits." });
    }

    // Si se está actualizando el teléfono, verificar que no esté duplicado
    if (phone) {
      const phoneCheck = await pool.query(
        "SELECT id_user FROM users WHERE phone = $1 AND id_user != $2",
        [phone, id]
      );

      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: "Phone number already exists" });
      }
    }

    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (name_user !== undefined) {
      updateFields.push(`name_user = $${paramCount}`);
      values.push(name_user);
      paramCount++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    updateFields.push(`updated_at = CURRENT_DATE`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id_user = $${paramCount} RETURNING id_user, name_user, phone, TO_CHAR(created_at, 'YYYY-MM-DD') as created_at, TO_CHAR(updated_at, 'YYYY-MM-DD') as updated_at`,
      values
    );

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rowCount } = await pool.query(
      "DELETE FROM users WHERE id_user = $1",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};