const express = require("express");
const router = express.Router();
const managerController = require("../controllers/managerController");

// Rutas públicas
router.get("/", managerController.getManagers);
router.get("/:id", managerController.getManagerById);
router.post("/", managerController.createManager);
router.put("/:id", managerController.updateManager);
router.delete("/:id", managerController.deleteManager);
router.get("/:id/memberships", managerController.getManagerMemberships);

module.exports = router;
