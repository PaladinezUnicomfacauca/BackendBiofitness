import express from "express";
import {
  getManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager,
} from "../controllers/managersController.js";

const router = express.Router();

router.get("/", getManagers);
router.get("/:id", getManagerById);
router.post("/", createManager);
router.put("/:id", updateManager);
router.delete("/:id", deleteManager);

export default router; 