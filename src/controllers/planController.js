const Plan = require("../models/planModel");

// Obtener todos los planes
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un plan específico
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear nuevo plan
const createPlan = async (req, res) => {
  try {
    const errors = Plan.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const plan = await Plan.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar plan
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = Plan.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const plan = await Plan.update(id, req.body);
    if (!plan) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar plan
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.delete(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }

    res.json({ message: "Plan eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener membresías de un plan
const getPlanMemberships = async (req, res) => {
  try {
    const { id } = req.params;
    const memberships = await Plan.getMemberships(id);
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanMemberships,
};
