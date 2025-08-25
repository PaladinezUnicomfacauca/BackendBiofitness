import { pool } from "../db/conn.js";

export const getStates = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM states ORDER BY id_state ASC");
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getStateById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid state ID" });
    }
    const { rows } = await pool.query(
      "SELECT * FROM states WHERE id_state = $1",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "State not found" });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createState = async (req, res) => {
  try {
    const states = req.body;
    const isBatch = Array.isArray(states);
    
    // Si es un solo estado, convertirlo en array para procesarlo uniformemente
    const statesArray = isBatch ? states : [states];
    
    // Validar que no esté vacío
    if (statesArray.length === 0) {
      return res.status(400).json({ error: "States data cannot be empty" });
    }

    // Validar límite de estados por lote
    if (statesArray.length > 50) {
      return res.status(400).json({ error: "Cannot create more than 50 states at once" });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < statesArray.length; i++) {
      const { name_state } = statesArray[i];

      try {
        // Validar campos requeridos
        if (!name_state || name_state.trim() === "") {
          errors.push({ index: i, error: "State name is required" });
          continue;
        }

        // Verificar que no exista un estado con el mismo nombre
        const nameCheck = await pool.query(
          "SELECT id_state FROM states WHERE name_state = $1",
          [name_state]
        );

        if (nameCheck.rows.length > 0) {
          errors.push({ index: i, error: "A state with this name already exists" });
          continue;
        }

        // Insertar estado
        const { rows } = await pool.query(
          "INSERT INTO states (name_state) VALUES ($1) RETURNING *",
          [name_state]
        );

        results.push(rows[0]);
      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    // Si es un solo estado y no hay errores, devolver solo el estado creado
    if (!isBatch && results.length === 1 && errors.length === 0) {
      return res.status(201).json(results[0]);
    }

    // Para lotes o cuando hay errores, devolver respuesta detallada
    const response = {
      created: results,
      errors: errors,
      summary: {
        total: statesArray.length,
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

export const updateState = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name_state } = req.body;
    if (!name_state || name_state.trim() === "") {
      return res.status(400).json({ error: "State name is required" });
    }
    // Verificar que el estado existe
    const stateCheck = await pool.query(
      "SELECT id_state FROM states WHERE id_state = $1",
      [id]
    );
    if (stateCheck.rows.length === 0) {
      return res.status(404).json({ error: "State not found" });
    }
    // Verificar que el nombre no esté duplicado
    const nameCheck = await pool.query(
      "SELECT id_state FROM states WHERE name_state = $1 AND id_state != $2",
      [name_state, id]
    );
    if (nameCheck.rows.length > 0) {
      return res.status(400).json({ error: "A state with this name already exists" });
    }
    const { rows } = await pool.query(
      "UPDATE states SET name_state = $1 WHERE id_state = $2 RETURNING *",
      [name_state, id]
    );
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteState = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Verificar que no tenga membresías asociadas
    const membershipsCheck = await pool.query(
      "SELECT id_membership FROM memberships WHERE id_state = $1",
      [id]
    );
    if (membershipsCheck.rows.length > 0) {
      return res.status(400).json({
        error: "Cannot delete state. There are memberships associated with this state. Please reassign memberships first."
      });
    }
    const { rowCount } = await pool.query(
      "DELETE FROM states WHERE id_state = $1",
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: "State not found" });
    }
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}; 