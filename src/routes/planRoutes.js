import express from "express";
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanMemberships,
} from "../controllers/planController.js";

const router = express.Router();

// Rutas básicas CRUD
router.get("/", getPlans);
router.get("/:id", getPlanById);
router.post("/", createPlan);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

// Ruta para obtener membresías de un plan
router.get("/:id/memberships", getPlanMemberships);

export default router;
