import express from "express";
import {
  getMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  getActiveMemberships,
  updateAllMembershipStates,
  exportMembershipsToExcel
} from "../controllers/membershipsController.js";
import { authenticateManager } from "../index.js";

const router = express.Router();

router.get("/", getMemberships);
router.get("/active", getActiveMemberships);
router.get("/export", exportMembershipsToExcel);
router.get("/:id", getMembershipById);
router.post("/", authenticateManager, createMembership);
router.put("/:id", authenticateManager, updateMembership);
router.delete("/:id", deleteMembership);
router.post("/update-states", updateAllMembershipStates);

export default router; 