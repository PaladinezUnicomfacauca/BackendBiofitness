import { pool } from "../db/conn.js";

export const getPlans = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM plans ORDER BY days_duration ASC");
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validar que el ID sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM plans WHERE id_plan = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { days_duration, price } = req.body;

    // Validar que days_duration sea un número positivo
    if (!days_duration || days_duration <= 0) {
      return res.status(400).json({ error: "Days duration must be a positive number" });
    }

    // Validar que price sea un número positivo
    if (!price || price <= 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    // Verificar que no exista un plan con la misma duración
    const durationCheck = await pool.query(
      "SELECT id_plan FROM plans WHERE days_duration = $1",
      [days_duration]
    );

    if (durationCheck.rows.length > 0) {
      return res.status(400).json({ error: "A plan with this duration already exists" });
    }

    const { rows } = await pool.query(
      "INSERT INTO plans (days_duration, price) VALUES ($1, $2) RETURNING *",
      [days_duration, price]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { days_duration, price } = req.body;

    // Verificar que el plan existe
    const planCheck = await pool.query(
      "SELECT id_plan FROM plans WHERE id_plan = $1",
      [id]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Si se está actualizando days_duration, verificar que no esté duplicado
    if (days_duration) {
      const durationCheck = await pool.query(
        "SELECT id_plan FROM plans WHERE days_duration = $1 AND id_plan != $2",
        [days_duration, id]
      );

      if (durationCheck.rows.length > 0) {
        return res.status(400).json({ error: "A plan with this duration already exists" });
      }
    }

    // Construir la consulta dinámicamente basada en los campos proporcionados
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (days_duration !== undefined) {
      if (days_duration <= 0) {
        return res.status(400).json({ error: "Days duration must be a positive number" });
      }
      updateFields.push(`days_duration = $${paramCount}`);
      values.push(days_duration);
      paramCount++;
    }

    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({ error: "Price must be a positive number" });
      }
      updateFields.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }

    // Si no hay campos para actualizar
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);

    const { rows } = await pool.query(
      `UPDATE plans SET ${updateFields.join(', ')} WHERE id_plan = $${paramCount} RETURNING *`,
      values
    );

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Verificar que el plan no tenga membresías asociadas
    const membershipsCheck = await pool.query(
      "SELECT id_membership FROM memberships WHERE id_plan = $1",
      [id]
    );

    if (membershipsCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete plan. There are memberships associated with this plan. Please reassign memberships first." 
      });
    }

    const { rowCount } = await pool.query(
      "DELETE FROM plans WHERE id_plan = $1",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}; 