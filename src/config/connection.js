import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost", 
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "orchidgym",
  port: process.env.DB_PORT || 5432,
});

const db = {
  query: (text, params) => pool.query(text, params),
};

export default db;
