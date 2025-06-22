import express from "express";
import {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentMethodMemberships,
} from "../controllers/paymentMethodController.js";

const router = express.Router();

// Rutas básicas CRUD
router.get("/", getPaymentMethods);
router.get("/:id", getPaymentMethodById);
router.post("/", createPaymentMethod);
router.put("/:id", updatePaymentMethod);
router.delete("/:id", deletePaymentMethod);

// Ruta para obtener membresías de un método de pago
router.get("/:id/memberships", getPaymentMethodMemberships);

export default router;
