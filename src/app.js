import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import managerRoutes from "./routes/managerRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import paymentMethodRoutes from "./routes/paymentMethodRoutes.js";
import estateRoutes from "./routes/estateRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Crear un router para la API
const apiRouter = express.Router();

// Definir las rutas en el router de la API
apiRouter.use("/managers", managerRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/memberships", membershipRoutes);
apiRouter.use("/plans", planRoutes);
apiRouter.use("/payment-methods", paymentMethodRoutes);
apiRouter.use("/states", estateRoutes);

// Usar el router de la API con el prefijo /api
app.use("/api", apiRouter);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Algo salió mal!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
