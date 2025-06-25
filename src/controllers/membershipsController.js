import { pool } from "../db/conn.js";

// Obtener todas las membresías con información relacionada (incluyendo manager)
export const getMemberships = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.id_membership,
        TO_CHAR(m.last_payment, 'YYYY-MM-DD') as last_payment,
        TO_CHAR(m.expiration_date, 'YYYY-MM-DD') as expiration_date,
        m.receipt_number, m.days_arrears, m.id_manager, m.id_user, m.id_plan, m.id_method, m.id_state,
        u.name_user, u.phone AS user_phone, 
        p.days_duration, p.price, 
        pm.name_method, 
        s.name_state,
        man.name_manager 
      FROM memberships m
      JOIN users u ON m.id_user = u.id_user
      JOIN managers man ON m.id_manager = man.id_manager
      JOIN plans p ON m.id_plan = p.id_plan
      JOIN payment_methods pm ON m.id_method = pm.id_method
      JOIN states s ON m.id_state = s.id_state
      ORDER BY m.id_membership DESC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Obtener una membresía por ID con información relacionada (incluyendo manager)
export const getMembershipById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid membership ID" });
    }
    const { rows } = await pool.query(`
      SELECT m.id_membership,
        TO_CHAR(m.last_payment, 'YYYY-MM-DD') as last_payment,
        TO_CHAR(m.expiration_date, 'YYYY-MM-DD') as expiration_date,
        m.receipt_number, m.days_arrears, m.id_manager, m.id_user, m.id_plan, m.id_method, m.id_state,
        u.name_user, u.phone AS user_phone, 
        p.days_duration, p.price, 
        pm.name_method, 
        s.name_state,
        man.name_manager, man.email AS manager_email
      FROM memberships m
      JOIN users u ON m.id_user = u.id_user
      JOIN managers man ON m.id_manager = man.id_manager
      JOIN plans p ON m.id_plan = p.id_plan
      JOIN payment_methods pm ON m.id_method = pm.id_method
      JOIN states s ON m.id_state = s.id_state
      WHERE m.id_membership = $1
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Membership not found" });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Crear una nueva membresía
export const createMembership = async (req, res) => {
  try {
    // expiration_date ya no se recibe, se calcula.
    const { receipt_number, days_arrears, id_user, id_plan, id_method, id_state, id_manager } = req.body;
    
    // Validaciones básicas - expiration_date ya no es requerido.
    if (!receipt_number || !id_user || !id_plan || !id_method || !id_state || !id_manager) {
      return res.status(400).json({ error: "receipt_number, id_user, id_plan, id_method, id_state, and id_manager are required" });
    }
    
    // Validar unicidad de receipt_number
    const receiptCheck = await pool.query(
      "SELECT id_membership FROM memberships WHERE receipt_number = $1",
      [receipt_number]
    );
    if (receiptCheck.rows.length > 0) {
      return res.status(400).json({ error: "Receipt number already exists" });
    }
    
    // 1. Obtener los días de duración del plan
    const planResult = await pool.query(
      "SELECT days_duration FROM plans WHERE id_plan = $1",
      [id_plan]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }
    const daysDuration = planResult.rows[0].days_duration;

    // 2. Insertar la membresía calculando la fecha de expiración
    const insertQuery = `
      INSERT INTO memberships (
        last_payment,
        expiration_date,
        receipt_number,
        days_arrears,
        id_user,
        id_plan,
        id_method,
        id_state,
        id_manager
      )
      VALUES (
        CURRENT_DATE,
        CURRENT_DATE + ($1 - 1) * INTERVAL '1 day',
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8
      )
      RETURNING 
        id_membership, 
        TO_CHAR(last_payment, 'YYYY-MM-DD') as last_payment, 
        TO_CHAR(expiration_date, 'YYYY-MM-DD') as expiration_date,
        receipt_number, days_arrears, id_manager, id_user, id_plan, id_method, id_state
    `;

    const values = [
      daysDuration,
      receipt_number,
      days_arrears || 0,
      id_user,
      id_plan,
      id_method,
      id_state,
      id_manager
    ];

    const { rows } = await pool.query(insertQuery, values);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Actualizar una membresía
export const updateMembership = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { last_payment, expiration_date, receipt_number, days_arrears, id_user, id_plan, id_method, id_state, id_manager } = req.body;
    // Verificar que la membresía existe
    const membershipCheck = await pool.query(
      "SELECT id_membership FROM memberships WHERE id_membership = $1",
      [id]
    );
    if (membershipCheck.rows.length === 0) {
      return res.status(404).json({ error: "Membership not found" });
    }
    // Si se actualiza receipt_number, validar unicidad
    if (receipt_number) {
      const receiptCheck = await pool.query(
        "SELECT id_membership FROM memberships WHERE receipt_number = $1 AND id_membership != $2",
        [receipt_number, id]
      );
      if (receiptCheck.rows.length > 0) {
        return res.status(400).json({ error: "Receipt number already exists" });
      }
    }
    // Construir la consulta dinámicamente
    let updateFields = [];
    let values = [];
    let paramCount = 1;
    if (last_payment !== undefined) {
      updateFields.push(`last_payment = $${paramCount}`);
      values.push(last_payment);
      paramCount++;
    }
    if (expiration_date !== undefined) {
      updateFields.push(`expiration_date = $${paramCount}`);
      values.push(expiration_date);
      paramCount++;
    }
    if (receipt_number !== undefined) {
      updateFields.push(`receipt_number = $${paramCount}`);
      values.push(receipt_number);
      paramCount++;
    }
    if (days_arrears !== undefined) {
      updateFields.push(`days_arrears = $${paramCount}`);
      values.push(days_arrears);
      paramCount++;
    }
    if (id_user !== undefined) {
      updateFields.push(`id_user = $${paramCount}`);
      values.push(id_user);
      paramCount++;
    }
    if (id_plan !== undefined) {
      updateFields.push(`id_plan = $${paramCount}`);
      values.push(id_plan);
      paramCount++;
    }
    if (id_method !== undefined) {
      updateFields.push(`id_method = $${paramCount}`);
      values.push(id_method);
      paramCount++;
    }
    if (id_state !== undefined) {
      updateFields.push(`id_state = $${paramCount}`);
      values.push(id_state);
      paramCount++;
    }
    if (id_manager !== undefined) {
      updateFields.push(`id_manager = $${paramCount}`);
      values.push(id_manager);
      paramCount++;
    }
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE memberships SET ${updateFields.join(', ')} WHERE id_membership = $${paramCount} RETURNING id_membership, TO_CHAR(last_payment, 'YYYY-MM-DD') as last_payment, TO_CHAR(expiration_date, 'YYYY-MM-DD') as expiration_date, receipt_number, days_arrears, id_manager, id_user, id_plan, id_method, id_state`,
      values
    );
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Eliminar una membresía
export const deleteMembership = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rowCount } = await pool.query(
      "DELETE FROM memberships WHERE id_membership = $1",
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: "Membership not found" });
    }
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}; 
