const Manager = require("../models/managerModel");

// Obtener todos los managers
const getManagers = async (req, res) => {
  try {
    const managers = await Manager.findAll();
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un manager específico
const getManagerById = async (req, res) => {
  try {
    const { id } = req.params;
    const manager = await Manager.findById(id);

    if (!manager) {
      return res.status(404).json({ message: "Manager no encontrado" });
    }

    res.json(manager);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Crear nuevo manager
const createManager = async (req, res) => {
  try {
    const errors = Manager.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const manager = await Manager.create(req.body);
    res.status(201).json(manager);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar manager
const updateManager = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = Manager.validate(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const manager = await Manager.update(id, req.body);
    if (!manager) {
      return res.status(404).json({ message: "Manager no encontrado" });
    }

    res.json(manager);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar manager
const deleteManager = async (req, res) => {
  try {
    const { id } = req.params;
    const manager = await Manager.delete(id);

    if (!manager) {
      return res.status(404).json({ message: "Manager no encontrado" });
    }

    res.json({ message: "Manager eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener membresías registradas por un manager
const getManagerMemberships = async (req, res) => {
  try {
    const { id } = req.params;
    const memberships = await Manager.getMemberships(id);
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager,
  getManagerMemberships,
};
