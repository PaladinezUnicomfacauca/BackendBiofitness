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
  getUserByIdWithActiveMembership,
  updateUserWithMembership
} from "../controllers/usersController.js";
import { authenticateManager } from "../index.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/with-membership", authenticateManager, createUserWithMembership);
router.get("/:id/memberships", getUserMemberships);
router.get("/with-memberships/active", getUsersWithActiveMemberships);
router.get("/:id/with-membership", getUserByIdWithActiveMembership);
router.put("/:id/with-membership", authenticateManager, updateUserWithMembership);

export default router;