import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    // Obtener el token del header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No hay token de autenticación" });
    }

    // Verificar el token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Agregar la información del usuario al request
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido" });
  }
};

export default auth;
