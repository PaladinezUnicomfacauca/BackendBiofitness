import express from "express";
import {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  updateAllMembershipStates,
  getActiveMemberships
} from "../controllers/membershipsController.js";

const router = express.Router();

// Rutas básicas (muestran todas las membresías)
router.get("/", getMemberships);
router.get("/:id", getMembershipById);

// Rutas específicas
router.get("/active/list", getActiveMemberships);
router.put("/update-states/all", updateAllMembershipStates);

// Rutas de creación y modificación
router.post("/", createMembership);
router.put("/:id", updateMembership);
router.delete("/:id", deleteMembership);

export default router; 