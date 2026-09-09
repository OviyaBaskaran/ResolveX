import mysql from "mysql2/promise";
import { env } from "./env.js";

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


export const testDatabaseConnection = async (): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    console.log("Database connected successfully");
  } finally {
    connection.release();
  }
};

export default pool;