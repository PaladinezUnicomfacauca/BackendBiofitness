const Estate = require("../models/estateModel");

// Obtener todos los estados
const getAllEstates = async (req, res) => {
  try {
    const estates = await Estate.findAll();
    res.json(estates);
  } catch (error) {
    console.error("Error al obtener estados:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener un estado por ID
const getEstateById = async (req, res) => {
  try {
    const { id } = req.params;
    const estate = await Estate.findById(id);

    if (!estate) {
      return res.status(404).json({ message: "Estado no encontrado" });
    }

    res.json(estate);
  } catch (error) {
    console.error("Error al obtener estado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear un nuevo estado
const createEstate = async (req, res) => {
  try {
    const { name_estate } = req.body;

    // Validar datos
    const errors = Estate.validate({ name_estate });
    if (errors.length > 0) {
      return res.status(400).json({ message: "Datos inválidos", errors });
    }

    // Verificar si ya existe un estado con ese nombre
    const existingEstates = await Estate.findByName(name_estate);
    if (existingEstates.length > 0) {
      return res
        .status(400)
        .json({ message: "Ya existe un estado con ese nombre" });
    }

    const estate = await Estate.create({ name_estate });
    res.status(201).json(estate);
  } catch (error) {
    console.error("Error al crear estado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Actualizar un estado
const updateEstate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_estate } = req.body;

    // Validar datos
    const errors = Estate.validate({ name_estate });
    if (errors.length > 0) {
      return res.status(400).json({ message: "Datos inválidos", errors });
    }

    // Verificar si ya existe otro estado con ese nombre
    const existingEstates = await Estate.findByName(name_estate);
    const hasDuplicate = existingEstates.some(
      (estate) => estate.id_estate !== parseInt(id)
    );
    if (hasDuplicate) {
      return res
        .status(400)
        .json({ message: "Ya existe un estado con ese nombre" });
    }

    const estate = await Estate.update(id, { name_estate });

    if (!estate) {
      return res.status(404).json({ message: "Estado no encontrado" });
    }

    res.json(estate);
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Eliminar un estado
const deleteEstate = async (req, res) => {
  try {
    const { id } = req.params;
    const estate = await Estate.delete(id);

    if (!estate) {
      return res.status(404).json({ message: "Estado no encontrado" });
    }

    res.json({ message: "Estado eliminado correctamente", estate });
  } catch (error) {
    console.error("Error al eliminar estado:", error);

    if (error.message.includes("está siendo usado")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Buscar estados por nombre
const searchEstates = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res
        .status(400)
        .json({ message: "El parámetro 'name' es requerido" });
    }

    const estates = await Estate.findByName(name);
    res.json(estates);
  } catch (error) {
    console.error("Error al buscar estados:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  getAllEstates,
  getEstateById,
  createEstate,
  updateEstate,
  deleteEstate,
  searchEstates,
};
