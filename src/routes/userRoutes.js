import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserMemberships,
} from "../controllers/userController.js";

const router = express.Router();

// Rutas básicas CRUD
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Ruta para obtener membresías de un usuario
router.get("/:id/memberships", getUserMemberships);

export default router;
