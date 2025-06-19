const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserMemberships,
} = require("../controllers/userController");

// Rutas básicas CRUD
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Ruta para obtener membresías de un usuario
router.get("/:id/memberships", getUserMemberships);

module.exports = router;
