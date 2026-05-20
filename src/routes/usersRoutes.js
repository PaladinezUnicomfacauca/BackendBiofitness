import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUserWithMembership,
  createUserWithMembership,
  getUserMemberships,
  getUsersWithActiveMemberships,
  getUserByIdWithActiveMembership,
  updateUserWithMembership,
  deleteUsersWithArrearsOverThreshold
} from "../controllers/usersController.js";
import { authenticateManager } from "../index.js";
import { uploadFaceOptional } from "../middleware/uploadFaceMiddleware.js";

const router = express.Router();

const handleOptionalFaceUpload = (req, res, next) => {
  uploadFaceOptional(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "La imagen no puede superar 5 MB" });
      }
      return res.status(400).json({ error: err.message || "Error al procesar la imagen" });
    }
    next();
  });
};

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.post(
  "/with-membership",
  authenticateManager,
  handleOptionalFaceUpload,
  createUserWithMembership
);
router.post("/clean-arrears", authenticateManager, async (req, res) => {
  try {
    const result = await deleteUsersWithArrearsOverThreshold();
    return res.status(200).json({
      message: result.deleted > 0
        ? `Se eliminaron ${result.deleted} usuario(s) con mora > 20 días`
        : "No hay usuarios con mora > 20 días para eliminar",
      deleted: result.deleted,
      ids: result.ids
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.get("/:id/memberships", getUserMemberships);
router.get("/with-memberships/active", getUsersWithActiveMemberships);
router.get("/:id/with-membership", getUserByIdWithActiveMembership);
router.put("/:id/with-membership", authenticateManager, updateUserWithMembership);
router.delete("/:id/with-membership", deleteUserWithMembership);

export default router;