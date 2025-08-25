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
    const plans = req.body;
    const isBatch = Array.isArray(plans);
    
    // Si es un solo plan, convertirlo en array para procesarlo uniformemente
    const plansArray = isBatch ? plans : [plans];
    
    // Validar que no esté vacío
    if (plansArray.length === 0) {
      return res.status(400).json({ error: "Plans data cannot be empty" });
    }

    // Validar límite de planes por lote
    if (plansArray.length > 50) {
      return res.status(400).json({ error: "Cannot create more than 50 plans at once" });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < plansArray.length; i++) {
      const { days_duration, price, plan_description } = plansArray[i];

      try {
        // Validar campos requeridos
        if (!days_duration || !price || !plan_description) {
          errors.push({ index: i, error: "days_duration, price and plan_description are required" });
          continue;
        }

        // Validar que days_duration sea un número positivo
        if (days_duration <= 0) {
          errors.push({ index: i, error: "Days duration must be a positive number" });
          continue;
        }

        // Validar que price sea un número positivo
        if (price <= 0) {
          errors.push({ index: i, error: "Price must be a positive number" });
          continue;
        }

        // Validar que plan_description no esté vacío
        if (plan_description.trim() === '') {
          errors.push({ index: i, error: "Plan description cannot be empty" });
          continue;
        }

        // Verificar que no exista un plan con la misma descripción
        const descriptionCheck = await pool.query(
          "SELECT id_plan FROM plans WHERE plan_description = $1",
          [plan_description]
        );

        if (descriptionCheck.rows.length > 0) {
          errors.push({ index: i, error: "A plan with this description already exists" });
          continue;
        }

        // Insertar plan
        const { rows } = await pool.query(
          "INSERT INTO plans (days_duration, price, plan_description) VALUES ($1, $2, $3) RETURNING *",
          [days_duration, price, plan_description]
        );

        results.push(rows[0]);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    // Si es un solo plan y no hay errores, devolver solo el plan creado
    if (!isBatch && results.length === 1 && errors.length === 0) {
      return res.status(201).json(results[0]);
    }

    // Para lotes o cuando hay errores, devolver respuesta detallada
    const response = {
      created: results,
      errors: errors,
      summary: {
        total: plansArray.length,
        successful: results.length,
        failed: errors.length
      }
    };

    if (results.length > 0) {
      res.status(201).json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { days_duration, price, plan_description } = req.body;

    // Verificar que el plan existe
    const planCheck = await pool.query(
      "SELECT id_plan FROM plans WHERE id_plan = $1",
      [id]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }



    // Si se está actualizando plan_description, verificar que no esté duplicado
    if (plan_description) {
      const descriptionCheck = await pool.query(
        "SELECT id_plan FROM plans WHERE plan_description = $1 AND id_plan != $2",
        [plan_description, id]
      );

      if (descriptionCheck.rows.length > 0) {
        return res.status(400).json({ error: "A plan with this description already exists" });
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

    if (plan_description !== undefined) {
      if (!plan_description || plan_description.trim() === '') {
        return res.status(400).json({ error: "Plan description cannot be empty" });
      }
      updateFields.push(`plan_description = $${paramCount}`);
      values.push(plan_description);
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