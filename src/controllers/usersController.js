import { pool } from "../db/conn.js";
import { uploadFaceImage, deleteFaceImageByPublicId } from "../utils/uploadFace.js";
import { calculateStateAndArrears } from "../utils/membershipState.js";
import {
  bulkDeleteUsersWithArrearsAndOrphans,
  DEFAULT_ARREARS_THRESHOLD,
} from "../utils/userCleanup.js";

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
      SELECT id_user, name_user, phone, face,
        TO_CHAR(created_at, 'YYYY-MM-DD') as created_at
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
      SELECT id_user, name_user, phone, face,
        TO_CHAR(created_at, 'YYYY-MM-DD') as created_at
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
    const users = req.body;
    const isBatch = Array.isArray(users);
    
    // Si es un solo usuario, convertirlo en array para procesarlo uniformemente
    const usersArray = isBatch ? users : [users];
    
    // Validar que no esté vacío
    if (usersArray.length === 0) {
      return res.status(400).json({ error: "Users data cannot be empty" });
    }

    // Validar límite de usuarios por lote
    if (usersArray.length > 100) {
      return res.status(400).json({ error: "Cannot create more than 100 users at once" });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < usersArray.length; i++) {
      const { name_user, phone } = usersArray[i];

      try {
        // Validar campos requeridos
        if (!name_user || !phone) {
          errors.push({ index: i, error: "name_user and phone are required" });
          continue;
        }

        // Validar que el teléfono tenga exactamente 10 dígitos
        if (!/^\d{10}$/.test(phone)) {
          errors.push({ index: i, error: "Phone number must have exactly 10 digits." });
          continue;
        }

        // Verificar que el teléfono no esté duplicado
        const phoneCheck = await pool.query(
          "SELECT id_user FROM users WHERE phone = $1",
          [phone]
        );

        if (phoneCheck.rows.length > 0) {
          errors.push({ index: i, error: "Phone number already exists" });
          continue;
        }

        // Insertar usuario
        const { rows } = await pool.query(
          "INSERT INTO users (name_user, phone) VALUES ($1, $2) RETURNING *",
          [name_user, phone]
        );

        results.push(rows[0]);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    // Si es un solo usuario y no hay errores, devolver solo el usuario creado
    if (!isBatch && results.length === 1 && errors.length === 0) {
      return res.status(201).json(results[0]);
    }

    // Para lotes o cuando hay errores, devolver respuesta detallada
    const response = {
      created: results,
      errors: errors,
      summary: {
        total: usersArray.length,
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

    values.push(id);

    const { rows } = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id_user = $${paramCount} RETURNING id_user, name_user, phone, face, TO_CHAR(created_at, 'YYYY-MM-DD') as created_at`,
      values
    );

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createUserWithMembership = async (req, res) => {
  try {
    const name_user = (req.body.name_user ?? "").trim();
    const phone = (req.body.phone ?? "").trim();
    const receipt_number = (req.body.receipt_number ?? "").trim();
    const id_plan = parseInt(req.body.id_plan, 10);
    const id_method = parseInt(req.body.id_method, 10);
    const id_manager = parseInt(req.body.id_manager, 10);

    // Validaciones
    if (!name_user || !phone || !receipt_number || Number.isNaN(id_plan) || Number.isNaN(id_method) || Number.isNaN(id_manager)) {
      return res.status(400).json({ 
        error: "name_user, phone, id_plan, id_method, id_manager y receipt_number son requeridos" 
      });
    }

    // Verificar que el teléfono no exista
    const existingUser = await pool.query(
      "SELECT id_user FROM users WHERE phone = $1",
      [phone]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "El número de teléfono ya existe" });
    }

    // Verificar que el receipt_number no esté duplicado
    const receiptCheck = await pool.query(
      "SELECT id_membership FROM memberships WHERE receipt_number = $1",
      [receipt_number]
    );
    if (receiptCheck.rows.length > 0) {
      return res.status(400).json({ error: "El número de recibo ya existe" });
    }

    // Verificar que el plan existe
    const planResult = await pool.query(
      "SELECT days_duration, price FROM plans WHERE id_plan = $1",
      [id_plan]
    );
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }
    const daysDuration = planResult.rows[0].days_duration;
    const planPrice = planResult.rows[0].price;

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

    let faceUrl = null;
    let facePublicId = null;
    if (req.file) {
      try {
        const uploadResult = await uploadFaceImage(req.file.buffer, req.file.mimetype);
        faceUrl = uploadResult.secure_url;
        facePublicId = uploadResult.public_id;
      } catch (uploadErr) {
        return res.status(400).json({
          error: uploadErr.message || "No se pudo subir la foto del rostro",
        });
      }
    }

    // Iniciar transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Crear el usuario
      const userResult = await client.query(`
        INSERT INTO users (name_user, phone, face, face_public_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id_user
      `, [name_user, phone, faceUrl, facePublicId]);
      
      const userId = userResult.rows[0].id_user;

      // 2. Verificar nuevamente que el receipt_number no esté duplicado (dentro de la transacción)
      const receiptCheckInTransaction = await client.query(
        "SELECT id_membership FROM memberships WHERE receipt_number = $1",
        [receipt_number]
      );
      if (receiptCheckInTransaction.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "El número de recibo ya existe" });
      }

      // 3. Calcular fecha de expiración
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + daysDuration - 1);
      const expirationDateStr = expirationDate.toISOString().split('T')[0];

      // 4. Calcular estado y días de mora
      const { id_state, days_arrears: daysArrears } = await calculateStateAndArrears(
        expirationDateStr,
        client
      );

      // 5. Calcular pago y deuda
      let pay = req.body.pay !== undefined ? parseInt(req.body.pay, 10) : planPrice;
      if (isNaN(pay) || pay < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "El valor de pago es inválido" });
      }
      if (pay > planPrice) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "El pago no puede ser mayor al precio del plan" });
      }
      const owe = planPrice - pay;

      // 6. Crear la membresía
      const membershipResult = await client.query(`
        INSERT INTO memberships (
          last_payment,
          expiration_date,
          receipt_number,
          days_arrears,
          pay,
          owe,
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
          $8,
          $9,
          $10
        )
        RETURNING id_membership, receipt_number
      `, [
        expirationDateStr,
        receipt_number,
        daysArrears,
        pay,
        owe,
        userId,
        id_plan,
        id_method,
        id_state,
        req.manager.id_manager
      ]);
      
      const membershipId = membershipResult.rows[0].id_membership;

      // 7. Obtener datos completos para la respuesta
      const finalResult = await client.query(`
        SELECT 
          u.id_user,
          u.name_user,
          u.phone,
          u.face,
          m.id_membership,
          TO_CHAR(m.last_payment, 'YYYY-MM-DD') as last_payment,
          TO_CHAR(m.expiration_date, 'YYYY-MM-DD') as expiration_date,
          m.receipt_number,
          m.days_arrears,
          m.pay,
          m.owe,
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
    console.error("[createUserWithMembership] Error:", error.message);
    if (error.message?.includes("columna") || error.code) {
      console.error("[createUserWithMembership] Detalle DB:", error.code, error.detail || "");
    }
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
        m.pay,
        m.owe,
        p.days_duration,
        p.price,
        pm.name_method,
        s.name_state,
        COALESCE(man.name_manager, m.manager_name_snapshot) as name_manager
      FROM memberships m
      JOIN plans p ON m.id_plan = p.id_plan
      JOIN payment_methods pm ON m.id_method = pm.id_method
      JOIN states s ON m.id_state = s.id_state
      LEFT JOIN managers man ON m.id_manager = man.id_manager
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
      SELECT id_user, name_user, phone, face,
        TO_CHAR(created_at, 'YYYY-MM-DD') as created_at
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
      SELECT id_user, name_user, phone, face,
        TO_CHAR(created_at, 'YYYY-MM-DD') as created_at
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


export const updateUserWithMembership = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { 
      name_user, 
      phone, 
      id_plan, 
      id_method, 
      id_manager,
      receipt_number
    } = req.body;

    // Validaciones
    if (!name_user || !phone || !id_plan || !id_method || !receipt_number) {
      return res.status(400).json({ 
        error: "name_user, phone, id_plan, id_method y receipt_number son requeridos" 
      });
    }

    // Verificar que el usuario existe
    const userCheck = await pool.query(
      "SELECT id_user FROM users WHERE id_user = $1",
      [userId]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verificar que el teléfono no esté duplicado (excluyendo el usuario actual)
    const phoneCheck = await pool.query(
      "SELECT id_user FROM users WHERE phone = $1 AND id_user != $2",
      [phone, userId]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    // Verificar que el receipt_number no esté duplicado (excluyendo la membresía actual del usuario)
    const receiptCheck = await pool.query(`
      SELECT m.id_membership 
      FROM memberships m 
      WHERE m.receipt_number = $1 
      AND m.id_user != $2
    `, [receipt_number, userId]);
    if (receiptCheck.rows.length > 0) {
      return res.status(400).json({ error: "Receipt number already exists" });
    }

    // Verificar que el plan existe
    const planResult = await pool.query(
      "SELECT days_duration, price FROM plans WHERE id_plan = $1",
      [id_plan]
    );
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }
    const daysDuration = planResult.rows[0].days_duration;
    const planPrice = planResult.rows[0].price;

    // Verificar que el método de pago existe
    const methodResult = await pool.query(
      "SELECT id_method FROM payment_methods WHERE id_method = $1",
      [id_method]
    );
    if (methodResult.rows.length === 0) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    // Obtener el manager actual si no se proporciona uno nuevo
    let finalManagerId = req.manager.id_manager;
    if (!id_manager) {
      const currentMembership = await pool.query(`
        SELECT id_manager FROM memberships 
        WHERE id_user = $1 
        ORDER BY id_membership DESC 
        LIMIT 1
      `, [userId]);
      if (currentMembership.rows.length === 0 || !currentMembership.rows[0].id_manager) {
        // Si no hay membresía previa o el id_manager es null, usa el admin logueado
        finalManagerId = req.manager.id_manager;
      } else {
        finalManagerId = currentMembership.rows[0].id_manager;
      }
    } else {
      // Verificar que el manager existe si se proporciona uno nuevo
      const managerResult = await pool.query(
        "SELECT id_manager FROM managers WHERE id_manager = $1",
        [id_manager]
      );
      if (managerResult.rows.length === 0) {
        return res.status(404).json({ error: "Manager not found" });
      }
      finalManagerId = id_manager;
    }

    // Iniciar transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Actualizar el usuario
      await client.query(`
        UPDATE users 
        SET name_user = $1, phone = $2
        WHERE id_user = $3
      `, [name_user, phone, userId]);

      // 2. Obtener la membresía activa/más reciente
      const currentMembership = await client.query(`
        SELECT id_membership, id_state, pay, owe
        FROM memberships 
        WHERE id_user = $1 
        ORDER BY id_membership DESC 
        LIMIT 1
      `, [userId]);

      if (currentMembership.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "No membership found for user" });
      }

      // 3. Actualizar la membresía existente
      const membershipId = currentMembership.rows[0].id_membership;

      // Calcular nueva fecha de expiración
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + daysDuration - 1);
      const expirationDateStr = expirationDate.toISOString().split('T')[0];

      const { id_state, days_arrears: daysArrears } = await calculateStateAndArrears(
        expirationDateStr,
        client
      );

      // Calcular pay y owe
      let payValue;
      if (req.body.pay !== undefined) {
        const parsedPay = parseInt(req.body.pay, 10);
        if (isNaN(parsedPay) || parsedPay < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: "El valor de pago es inválido" });
        }
        if (parsedPay > planPrice) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: "El pago no puede ser mayor al precio del plan" });
        }
        payValue = parsedPay;
      } else {
        const prevPay = currentMembership.rows[0].pay;
        payValue = (prevPay === null || prevPay === undefined) ? planPrice : prevPay;
      }
      const oweValue = Math.max(0, planPrice - payValue);

      // Actualizar la membresía incluyendo pay/owe
      await client.query(`
        UPDATE memberships 
        SET last_payment = CURRENT_DATE,
            expiration_date = $1,
            receipt_number = $2,
            days_arrears = $3,
            id_plan = $4,
            id_method = $5,
            id_state = $6,
            id_manager = $7,
            pay = $8,
            owe = $9
        WHERE id_membership = $10
      `, [
        expirationDateStr,
        receipt_number,
        daysArrears,
        id_plan,
        id_method,
        id_state,
        finalManagerId,
        payValue,
        oweValue,
        membershipId
      ]);

      await client.query('COMMIT');
      
      // Obtener datos actualizados del usuario
      const updatedUserResult = await client.query(`
        SELECT id_user, name_user, phone, face,
          TO_CHAR(created_at, 'YYYY-MM-DD') as created_at
        FROM users 
        WHERE id_user = $1
      `, [userId]);
      
      res.status(200).json({
        message: "User updated successfully",
        user: updatedUserResult.rows[0]
      });
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

/**
 * Elimina usuarios y sus membresías cuando alguna membresía tiene days_arrears > 20.
 * También elimina usuarios huérfanos (sin ninguna membresía).
 * SQL en lote; fotos en Cloudinary se eliminan después (API externa).
 */
export const deleteUsersWithArrearsOverThreshold = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { deleted, ids, facePublicIds } = await bulkDeleteUsersWithArrearsAndOrphans(
      client,
      DEFAULT_ARREARS_THRESHOLD
    );
    await client.query("COMMIT");

    if (facePublicIds.length > 0) {
      await Promise.allSettled(
        facePublicIds.map((publicId) => deleteFaceImageByPublicId(publicId))
      );
    }

    return { deleted, ids };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Elimina un usuario por id y todas sus membresías.
 */
export const deleteUserWithMembership = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const userCheck = await pool.query(
      "SELECT id_user, face_public_id FROM users WHERE id_user = $1",
      [id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const facePublicId = userCheck.rows[0].face_public_id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("DELETE FROM memberships WHERE id_user = $1", [id]);
      const { rowCount } = await client.query("DELETE FROM users WHERE id_user = $1", [id]);
      await client.query('COMMIT');
      if (rowCount === 0) return res.status(404).json({ message: "User not found" });

      if (facePublicId) {
        await deleteFaceImageByPublicId(facePublicId);
      }

      return res.sendStatus(204);
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
