import app from "./app.js";
import { env } from "./config/env.js";
import { testDatabaseConnection } from "./config/database.js";

const startServer = async (): Promise<void> => {
  try {
    await testDatabaseConnection();

    app.listen(env.port, () => {
      console.log(`ResolveX API running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();