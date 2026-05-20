import { pool } from "../db/conn.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
      return res.status(400).json({ error: "ID de administrador inválido" });
    }

    const { rows } = await pool.query(
      "SELECT * FROM managers WHERE id_manager = $1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Administrador no encontrado" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener los administradores" });
  }
};

export const createManager = async (req, res) => {
  try {
    const managers = req.body;
    const isBatch = Array.isArray(managers);
    
    // Si es un solo manager, convertirlo en array para procesarlo uniformemente
    const managersArray = isBatch ? managers : [managers];
    
    // Validar que no esté vacío
    if (managersArray.length === 0) {
      return res.status(400).json({ error: "Los datos de los administradores no pueden estar vacíos" });
    }

    // Validar límite de managers por lote
    if (managersArray.length > 50) {
      return res.status(400).json({ error: "No se puede crear más de 50 administradores a la vez" });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < managersArray.length; i++) {
      const { name_manager, phone, email, password } = managersArray[i];

      try {
        // Validar campos requeridos
        if (!name_manager || !phone || !email || !password) {
          errors.push({ index: i, error: "Nombre, teléfono, email y contraseña son requeridos" });
          continue;
        }

        // Validar que el teléfono tenga exactamente 10 dígitos
        if (!/^\d{10}$/.test(phone)) {
          errors.push({ index: i, error: "El teléfono debe tener exactamente 10 dígitos." });
          continue;
        }

        // Validar formato de email: debe contener @ y el dominio debe tener 2 o 3 letras
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,3}$/;
        if (!emailRegex.test(email)) {
          errors.push({ index: i, error: "Invalid email format. Email must contain '@' and a valid domain (2-3 letters)." });
          continue;
        }

        // Verificar que el teléfono no esté duplicado
        const phoneCheck = await pool.query(
          "SELECT id_manager FROM managers WHERE phone = $1",
          [phone]
        );

        if (phoneCheck.rows.length > 0) {
          errors.push({ index: i, error: "Phone number already exists" });
          continue;
        }

        // Verificar que el email no esté duplicado
        const emailCheck = await pool.query(
          "SELECT id_manager FROM managers WHERE email = $1",
          [email]
        );

        if (emailCheck.rows.length > 0) {
          errors.push({ index: i, error: "Email already exists" });
          continue;
        }

        // Hashear la contraseña antes de guardar
        const hashedPassword = await bcrypt.hash(password, 10);
        const { rows } = await pool.query(
          "INSERT INTO managers (name_manager, phone, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
          [name_manager, phone, email, hashedPassword]
        );

        results.push(rows[0]);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    // Si es un solo manager y no hay errores, devolver solo el manager creado
    if (!isBatch && results.length === 1 && errors.length === 0) {
      return res.status(201).json(results[0]);
    }

    // Para lotes o cuando hay errores, devolver respuesta detallada
    const response = {
      created: results,
      errors: errors,
      summary: {
        total: managersArray.length,
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
    return res.status(500).json({ error: "Error al crear el administrador" });
  }
};

export const updateManager = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name_manager, phone, email, password, currentPassword } = req.body;

    // Verificar que el manager existe y obtener la contraseña actual
    const managerCheck = await pool.query(
      "SELECT id_manager, password FROM managers WHERE id_manager = $1",
      [id]
    );

    if (managerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Administrador no encontrado" });
    }

    // Si se va a cambiar la contraseña, validar la contraseña actual
    if (password !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({ error: "La contraseña actual es obligatoria para cambiar la contraseña" });
      }
      const dbPassword = managerCheck.rows[0].password;
      const passwordMatch = await bcrypt.compare(currentPassword, dbPassword);
      if (!passwordMatch) {
        return res.status(400).json({ error: "La contraseña actual es incorrecta" });
      }
    }

    // Si se está actualizando el teléfono, validar que tenga exactamente 10 dígitos
    if (phone !== undefined) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ error: "El teléfono debe tener exactamente 10 dígitos." });
      }
      // Verificar que no esté duplicado
      const phoneCheck = await pool.query(
        "SELECT id_manager FROM managers WHERE phone = $1 AND id_manager != $2",
        [phone, id]
      );
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: "El teléfono ya existe" });
      }
    }

    // Si se está actualizando el email, validar formato
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,3}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Formato de email inválido. El email debe contener '@' y un dominio válido (2-3 letras)." });
      }
    }

    // Si se está actualizando el email, verificar que no esté duplicado
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id_manager FROM managers WHERE email = $1 AND id_manager != $2",
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "El email ya existe" });
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
      // Hashear la nueva contraseña antes de guardar
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    values.push(id);

    const { rows } = await pool.query(
      `UPDATE managers SET ${updateFields.join(', ')} WHERE id_manager = $${paramCount} RETURNING *`,
      values
    );

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "Error al actualizar el administrador" });
  }
};

export const deleteManager = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Obtener el nombre del manager antes de eliminarlo
    const managerResult = await pool.query(
      "SELECT name_manager FROM managers WHERE id_manager = $1",
      [id]
    );
    if (managerResult.rows.length === 0) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }
    const managerName = managerResult.rows[0].name_manager;

    // Actualizar las membresías asociadas: guardar el nombre y poner id_manager en NULL
    await pool.query(
      `UPDATE memberships 
       SET manager_name_snapshot = $1, id_manager = NULL 
       WHERE id_manager = $2`,
      [managerName, id]
    );

    // Eliminar el manager
    const { rowCount } = await pool.query(
      "DELETE FROM managers WHERE id_manager = $1",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ error: "Error al eliminar el administrador" });
  }
};

export const loginManager = async (req, res) => {
  try {
    const { name_manager, password } = req.body;
    if (!name_manager || !password) {
      return res.status(400).json({ error: "Nombre y contraseña son requeridos" });
    }
    // Buscar manager por name_manager
    const { rows } = await pool.query(
      "SELECT id_manager, name_manager, email, password FROM managers WHERE name_manager = $1",
      [name_manager]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    const manager = rows[0];
    // Comparar contraseña
    const passwordMatch = await bcrypt.compare(password, manager.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
    // Generar JWT
    const token = jwt.sign(
      { id_manager: manager.id_manager, name_manager: manager.name_manager },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    // Devolver token y datos básicos
    return res.status(200).json({
      token,
      manager: {
        id_manager: manager.id_manager,
        name_manager: manager.name_manager,
        email: manager.email
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
};