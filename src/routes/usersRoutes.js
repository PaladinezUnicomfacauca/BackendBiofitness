import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  createUserWithMembership,
  getUserMemberships,
  getUsersWithActiveMemberships,
  getUserByIdWithActiveMembership
} from "../controllers/usersController.js";

const router = express.Router();

// Rutas básicas (muestran solo información de usuarios)
router.get("/", getUsers);
router.get("/:id", getUserById);

// Rutas con información de membresías
router.get("/with-memberships/active", getUsersWithActiveMemberships);
router.get("/:id/with-membership", getUserByIdWithActiveMembership);
router.get("/:id/memberships", getUserMemberships);

// Rutas de creación y modificación
router.post("/", createUser);
router.post("/with-membership", createUserWithMembership);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;