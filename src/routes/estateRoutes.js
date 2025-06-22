import express from "express";
import {
  getAllEstates,
  getEstateById,
  createEstate,
  updateEstate,
  deleteEstate,
  searchEstates,
} from "../controllers/estateController.js";

const router = express.Router();

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

export default router;
