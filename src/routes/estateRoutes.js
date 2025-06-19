const express = require("express");
const router = express.Router();
const {
  getAllEstates,
  getEstateById,
  createEstate,
  updateEstate,
  deleteEstate,
  searchEstates,
} = require("../controllers/estateController");

// Obtener todos los estados
router.get("/", getAllEstates);

// Buscar estados por nombre
router.get("/search", searchEstates);

// Obtener un estado por ID
router.get("/:id", getEstateById);

// Crear un nuevo estado
router.post("/", createEstate);

// Actualizar un estado
router.put("/:id", updateEstate);

// Eliminar un estado
router.delete("/:id", deleteEstate);

module.exports = router;
