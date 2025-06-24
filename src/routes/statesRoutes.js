import express from "express";
import {
  getStates,
  getStateById,
  createState,
  updateState,
  deleteState
} from "../controllers/statesController.js";

const router = express.Router();

router.get("/", getStates);
router.get("/:id", getStateById);
router.post("/", createState);
router.put("/:id", updateState);
router.delete("/:id", deleteState);

export default router; 