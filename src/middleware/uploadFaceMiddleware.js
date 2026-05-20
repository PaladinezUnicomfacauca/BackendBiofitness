import multer from "multer";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

export const uploadFaceOptional = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (!file || !file.mimetype.startsWith("image/")) {
      cb(new Error("El archivo debe ser una imagen"));
      return;
    }
    cb(null, true);
  },
}).single("face");
