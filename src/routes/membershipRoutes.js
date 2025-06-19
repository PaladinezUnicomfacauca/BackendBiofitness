const express = require("express");
const router = express.Router();
const {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  getExpiringMemberships,
  getExpiredMemberships,
  getActiveMemberships,
  getAllMemberships,
} = require("../controllers/membershipController");

// Rutas básicas CRUD
router.get("/", getMemberships);
router.get("/:id", getMembershipById);
router.post("/", createMembership);
router.put("/:id", updateMembership);
router.delete("/:id", deleteMembership);

// Rutas adicionales para estados de membresía
router.get("/expiring", getExpiringMemberships);
router.get("/expired", getExpiredMemberships);
router.get("/active", getActiveMemberships);

// Obtener todas las membresías con detalles
router.get("/all", getAllMemberships);

module.exports = router;
