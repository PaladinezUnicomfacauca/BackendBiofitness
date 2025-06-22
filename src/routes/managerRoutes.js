import express from "express";
import managerController from "../controllers/managerController.js";

const router = express.Router();

// Rutas públicas
router.get("/", managerController.getManagers);
router.get("/:id", managerController.getManagerById);
router.post("/", managerController.createManager);
router.put("/:id", managerController.updateManager);
router.delete("/:id", managerController.deleteManager);
router.get("/:id/memberships", managerController.getManagerMemberships);

export default router;
