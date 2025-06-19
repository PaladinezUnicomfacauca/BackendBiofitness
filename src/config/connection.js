const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "orchidgym",
  password: process.env.DB_PASSWORD || "root",
  port: process.env.DB_PORT || 5432,
});

// Exportar un objeto con el método query para mantener la consistencia
module.exports = {
  query: (text, params) => pool.query(text, params),
};
