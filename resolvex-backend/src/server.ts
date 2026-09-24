import app from "./app.js";
import { env } from "./config/env.js";
import pool from "./config/database.js";
import { testDatabaseConnection } from "./config/test-database.js";

async function startServer(): Promise<void> {
  await testDatabaseConnection();

  const server = app.listen(env.port, () => {
    console.log(`ResolveX API running on port ${env.port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received. Shutting down ResolveX API...`);

    server.close(async () => {
      await pool.end();

      console.log("MySQL connection pool closed.");
      console.log("ResolveX API stopped.");

      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

void startServer();