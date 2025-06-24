import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import managersRoutes from "./routes/managersRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import membershipsRoutes from "./routes/membershipsRoutes.js";
import plansRoutes from "./routes/plansRoutes.js";
import paymentMethodsRoutes from "./routes/paymentMethodsRoutes.js";
import statesRoutes from "./routes/statesRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Crear un router para la API
const apiRouter = express.Router();

// Definir las rutas en el router de la API
apiRouter.use("/managers", managersRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/memberships", membershipsRoutes);
apiRouter.use("/plans", plansRoutes);
apiRouter.use("/payment-methods", paymentMethodsRoutes);
apiRouter.use("/states", statesRoutes);

// Usar el router de la API con el prefijo /api
app.use("/api", apiRouter);

// Middleware para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Algo salió mal!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT} [${process.env.NODE_ENV || "dev"}] - ${new Date().toLocaleString()}`);
});
