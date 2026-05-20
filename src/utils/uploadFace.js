import { v2 as cloudinary } from "cloudinary";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME);
}

/**
 * Sube un buffer de imagen a Cloudinary y devuelve secure_url y public_id.
 * Usa CLOUDINARY_URL del entorno si está definido.
 */
export async function uploadFaceImage(buffer, mimetype) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary no está configurado (CLOUDINARY_URL)");
  }
  if (!ALLOWED_MIME.has(mimetype)) {
    throw new Error("Tipo de imagen no permitido");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "biofitness/faces",
        resource_type: "image",
        // Recorta al rostro y redondea al maximo para obtener avatar circular.
        transformation: [
          { width: 500, height: 500, crop: "fill", gravity: "face" },
          { radius: "max" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url) {
          reject(new Error("Respuesta inválida de Cloudinary"));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteFaceImageByPublicId(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    return result?.result === "ok" || result?.result === "not found";
  } catch {
    return false;
  }
}
