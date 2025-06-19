const express = require("express");
const router = express.Router();
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanMemberships,
} = require("../controllers/planController");

// Rutas básicas CRUD
router.get("/", getPlans);
router.get("/:id", getPlanById);
router.post("/", createPlan);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

// Ruta para obtener membresías de un plan
router.get("/:id/memberships", getPlanMemberships);

module.exports = router;
