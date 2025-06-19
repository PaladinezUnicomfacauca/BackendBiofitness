const Membership = require("../models/membershipModel");
const db = require("../config/connection");

// Obtener todas las membresías
const getMemberships = async (req, res) => {
  try {
    const memberships = await Membership.findAll();
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una membresía específica
const getMembershipById = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findById(id);

    if (!membership) {
      return res.status(404).json({ message: "Membresía no encontrada" });
    }

    res.json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear nueva membresía
const createMembership = async (req, res) => {
  try {
    const errors = Membership.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const membership = await Membership.create(req.body);
    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar membresía
const updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = Membership.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const membership = await Membership.update(id, req.body);
    if (!membership) {
      return res.status(404).json({ message: "Membresía no encontrada" });
    }

    res.json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar membresía
const deleteMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.delete(id);

    if (!membership) {
      return res.status(404).json({ message: "Membresía no encontrada" });
    }

    res.json({ message: "Membresía eliminada" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener membresías por vencer
const getExpiringMemberships = async (req, res) => {
  try {
    const memberships = await Membership.findExpiring();
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener membresías vencidas
const getExpiredMemberships = async (req, res) => {
  try {
    const memberships = await Membership.findExpired();
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener membresías activas
const getActiveMemberships = async (req, res) => {
  try {
    const memberships = await Membership.findActive();
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las membresías con información relacionada
const getAllMemberships = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.*,
        u.name_user,
        u.phone,
        u.created_at,
        mg.name_manager,
        p.days_duration,
        p.price,
        pm.name_method,
        e.name_estate
      FROM memberships m
      JOIN users u ON m.id_user = u.id_user
      JOIN managers mg ON u.id_manager = mg.id_manager
      JOIN plans p ON m.id_plan = p.id_plan
      JOIN payment_methods pm ON m.id_method = pm.id_method
      JOIN estates e ON m.id_estate = e.id_estate
      ORDER BY m.id_membership DESC
    `;

    const result = await db.query(query);

    // Transformar los datos para que coincidan con la estructura esperada
    const memberships = result.rows.map((row) => ({
      id_membership: row.id_membership,
      last_payment: row.last_payment,
      amount_paid: row.amount_paid,
      expiration_date: row.expiration_date,
      receipt_number: row.receipt_number,
      days_arrears: row.days_arrears,
      user: {
        id_user: row.id_user,
        name_user: row.name_user,
        phone: row.phone,
        created_at: row.created_at,
        manager: {
          name_manager: row.name_manager,
        },
      },
      plan: {
        days_duration: row.days_duration,
        price: row.price,
      },
      payment_method: {
        name_method: row.name_method,
      },
      estate: {
        name_estate: row.name_estate,
      },
    }));

    res.json(memberships);
  } catch (error) {
    console.error("Error al obtener membresías:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  getExpiringMemberships,
  getExpiredMemberships,
  getActiveMemberships,
  getAllMemberships,
};
