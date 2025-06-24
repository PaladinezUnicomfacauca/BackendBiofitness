import { pool } from "../db/conn.js";

export const getPaymentMethods = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM payment_methods ORDER BY id_method ASC");
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getPaymentMethodById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid payment method ID" });
    }
    const { rows } = await pool.query(
      "SELECT * FROM payment_methods WHERE id_method = $1",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createPaymentMethod = async (req, res) => {
  try {
    const { name_method } = req.body;
    if (!name_method || name_method.trim() === "") {
      return res.status(400).json({ error: "Payment method name is required" });
    }
    // Verificar que no exista un método con el mismo nombre
    const nameCheck = await pool.query(
      "SELECT id_method FROM payment_methods WHERE name_method = $1",
      [name_method]
    );
    if (nameCheck.rows.length > 0) {
      return res.status(400).json({ error: "A payment method with this name already exists" });
    }
    const { rows } = await pool.query(
      "INSERT INTO payment_methods (name_method) VALUES ($1) RETURNING *",
      [name_method]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updatePaymentMethod = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name_method } = req.body;
    if (!name_method || name_method.trim() === "") {
      return res.status(400).json({ error: "Payment method name is required" });
    }
    // Verificar que el método existe
    const methodCheck = await pool.query(
      "SELECT id_method FROM payment_methods WHERE id_method = $1",
      [id]
    );
    if (methodCheck.rows.length === 0) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    // Verificar que el nombre no esté duplicado
    const nameCheck = await pool.query(
      "SELECT id_method FROM payment_methods WHERE name_method = $1 AND id_method != $2",
      [name_method, id]
    );
    if (nameCheck.rows.length > 0) {
      return res.status(400).json({ error: "A payment method with this name already exists" });
    }
    const { rows } = await pool.query(
      "UPDATE payment_methods SET name_method = $1 WHERE id_method = $2 RETURNING *",
      [name_method, id]
    );
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deletePaymentMethod = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verificar que no tenga membresías asociadas
    const membershipsCheck = await pool.query(
      "SELECT id_membership FROM memberships WHERE id_method = $1",
      [id]
    );
    if (membershipsCheck.rows.length > 0) {
      return res.status(400).json({
        error: "Cannot delete payment method. There are memberships associated with this method. Please reassign memberships first."
      });
    }
    const { rowCount } = await pool.query(
      "DELETE FROM payment_methods WHERE id_method = $1",
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}; 