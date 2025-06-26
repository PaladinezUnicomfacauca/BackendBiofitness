import { pool } from "../db/conn.js";

// Función helper para obtener la membresía activa de un usuario
const getActiveMembership = async (userId) => {
  const result = await pool.query(`
    SELECT m.id_membership,
      TO_CHAR(m.last_payment, 'YYYY-MM-DD') as last_payment,
      TO_CHAR(m.expiration_date, 'YYYY-MM-DD') as expiration_date,
      m.receipt_number,
      m.days_arrears,
      p.days_duration,
      p.price,
      pm.name_method,
      s.name_state
    FROM memberships m
    JOIN plans p ON m.id_plan = p.id_plan
    JOIN payment_methods pm ON m.id_method = pm.id_method
    JOIN states s ON m.id_state = s.id_state
    WHERE m.id_user = $1 AND s.name_state IN ('Vigente', 'Por vencer')
    ORDER BY m.id_membership DESC
    LIMIT 1
  `, [userId]);
  
  return result.rows[0] || null;
};

// Obtener todos los usuarios
export const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id_user, name_user, phone, 
        TO_CHAR(created_at, 'YYYY-MM-DD') as created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD') as updated_at
      FROM users
      ORDER BY id_user DESC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const { rows } = await pool.query(`
      SELECT id_user, name_user, phone, 
        TO_CHAR(created_at, 'YYYY-MM-DD') as created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD') as updated_at
      FROM users 
      WHERE id_user = $1
    `, [id]);
    
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

// Crear usuario con membresía en una sola transacción
export const createUserWithMembership = async (req, res) => {
  try {
    const { 
      name_user, 
      phone, 
      id_plan, 
      id_method, 
      id_manager 
    } = req.body;

    // Validaciones
    if (!name_user || !phone || !id_plan || !id_method || !id_manager) {
      return res.status(400).json({ 
        error: "name_user, phone, id_plan, id_method, and id_manager are required" 
      });
    }

    // Verificar que el teléfono no exista
    const existingUser = await pool.query(
      "SELECT id_user FROM users WHERE phone = $1",
      [phone]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    // Verificar que el plan existe
    const planResult = await pool.query(
      "SELECT days_duration FROM plans WHERE id_plan = $1",
      [id_plan]
    );
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }
    const daysDuration = planResult.rows[0].days_duration;

    // Verificar que el método de pago existe
    const methodResult = await pool.query(
      "SELECT id_method FROM payment_methods WHERE id_method = $1",
      [id_method]
    );
    if (methodResult.rows.length === 0) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    // Verificar que el manager existe
    const managerResult = await pool.query(
      "SELECT id_manager FROM managers WHERE id_manager = $1",
      [id_manager]
    );
    if (managerResult.rows.length === 0) {
      return res.status(404).json({ error: "Manager not found" });
    }

    // Iniciar transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Crear el usuario
      const userResult = await client.query(`
        INSERT INTO users (name_user, phone)
        VALUES ($1, $2)
        RETURNING id_user
      `, [name_user, phone]);
      
      const userId = userResult.rows[0].id_user;

      // 2. Generar receipt_number
      const lastReceipt = await client.query(
        "SELECT receipt_number FROM memberships ORDER BY id_membership DESC LIMIT 1"
      );
      let nextNumber = 1;
      if (lastReceipt.rows.length > 0) {
        const last = lastReceipt.rows[0].receipt_number;
        const match = last.match(/^OG-(\d{7})$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const receipt_number = `OG-${nextNumber.toString().padStart(7, '0')}`;

      // 3. Calcular fecha de expiración
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + daysDuration - 1);
      const expirationDateStr = expirationDate.toISOString().split('T')[0];

      // 4. Calcular estado y días de mora
      const today = new Date();
      const expiration = new Date(expirationDateStr);
      const daysUntilExpiration = Math.ceil((expiration - today) / (1000 * 60 * 60 * 24));
      
      let stateName;
      let daysArrears = 0;
      
      if (daysUntilExpiration > 5) {
        stateName = "Vigente";
      } else if (daysUntilExpiration >= 0) {
        stateName = "Por vencer";
      } else {
        stateName = "Vencido";
        daysArrears = Math.abs(daysUntilExpiration);
      }
      
      const stateResult = await client.query(
        "SELECT id_state FROM states WHERE name_state = $1",
        [stateName]
      );
      
      if (stateResult.rows.length === 0) {
        throw new Error(`State '${stateName}' not found in database`);
      }
      
      const id_state = stateResult.rows[0].id_state;

      // 5. Crear la membresía
      const membershipResult = await client.query(`
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
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8
        )
        RETURNING id_membership
      `, [
        expirationDateStr,
        receipt_number,
        daysArrears,
        userId,
        id_plan,
        id_method,
        id_state,
        id_manager
      ]);

      const membershipId = membershipResult.rows[0].id_membership;

      // 6. Obtener datos completos para la respuesta
      const finalResult = await client.query(`
        SELECT 
          u.id_user,
          u.name_user,
          u.phone,
          m.id_membership,
          TO_CHAR(m.last_payment, 'YYYY-MM-DD') as last_payment,
          TO_CHAR(m.expiration_date, 'YYYY-MM-DD') as expiration_date,
          m.receipt_number,
          m.days_arrears,
          p.days_duration,
          p.price,
          pm.name_method,
          s.name_state,
          man.name_manager
        FROM users u
        JOIN memberships m ON u.id_user = m.id_user
        JOIN plans p ON m.id_plan = p.id_plan
        JOIN payment_methods pm ON m.id_method = pm.id_method
        JOIN states s ON m.id_state = s.id_state
        JOIN managers man ON m.id_manager = man.id_manager
        WHERE u.id_user = $1 AND m.id_membership = $2
      `, [userId, membershipId]);

      await client.query('COMMIT');
      
      res.status(201).json(finalResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Obtener todas las membresías de un usuario específico
export const getUserMemberships = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Verificar que el usuario existe
    const userCheck = await pool.query(
      "SELECT id_user FROM users WHERE id_user = $1",
      [id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { rows } = await pool.query(`
      SELECT m.id_membership,
        TO_CHAR(m.last_payment, 'YYYY-MM-DD') as last_payment,
        TO_CHAR(m.expiration_date, 'YYYY-MM-DD') as expiration_date,
        m.receipt_number,
        m.days_arrears,
        p.days_duration,
        p.price,
        pm.name_method,
        s.name_state,
        man.name_manager
      FROM memberships m
      JOIN plans p ON m.id_plan = p.id_plan
      JOIN payment_methods pm ON m.id_method = pm.id_method
      JOIN states s ON m.id_state = s.id_state
      JOIN managers man ON m.id_manager = man.id_manager
      WHERE m.id_user = $1
      ORDER BY m.id_membership DESC
    `, [id]);

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Obtener todos los usuarios con información de membresía activa
export const getUsersWithActiveMemberships = async (req, res) => {
  try {
    const { rows: users } = await pool.query(`
      SELECT id_user, name_user, phone, 
        TO_CHAR(created_at, 'YYYY-MM-DD') as created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD') as updated_at
      FROM users
      ORDER BY id_user DESC
    `);

    // Agregar información de membresía activa a cada usuario
    const usersWithMemberships = await Promise.all(
      users.map(async (user) => {
        const activeMembership = await getActiveMembership(user.id_user);
        return {
          ...user,
          active_membership: activeMembership
        };
      })
    );

    return res.status(200).json(usersWithMemberships);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Obtener un usuario por ID con información de membresía activa
export const getUserByIdWithActiveMembership = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const { rows } = await pool.query(`
      SELECT id_user, name_user, phone, 
        TO_CHAR(created_at, 'YYYY-MM-DD') as created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD') as updated_at
      FROM users 
      WHERE id_user = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];
    const activeMembership = await getActiveMembership(id);

    return res.status(200).json({
      ...user,
      active_membership: activeMembership
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};