const express = require("express");
const router = express.Router();
const {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentMethodMemberships,
} = require("../controllers/paymentMethodController");

// Rutas básicas CRUD
router.get("/", getPaymentMethods);
router.get("/:id", getPaymentMethodById);
router.post("/", createPaymentMethod);
router.put("/:id", updatePaymentMethod);
router.delete("/:id", deletePaymentMethod);

// Ruta para obtener membresías de un método de pago
router.get("/:id/memberships", getPaymentMethodMemberships);

module.exports = router;
