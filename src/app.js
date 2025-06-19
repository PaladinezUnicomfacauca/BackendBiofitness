const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Importar rutas
const managerRoutes = require("./routes/managerRoutes");
const userRoutes = require("./routes/userRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const planRoutes = require("./routes/planRoutes");
const paymentMethodRoutes = require("./routes/paymentMethodRoutes");
const estateRoutes = require("./routes/estateRoutes");

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
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
