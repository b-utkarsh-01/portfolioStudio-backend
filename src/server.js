import { env } from "./config/env.js";
import { connectToDatabase } from "./db/connect.js";
import { createApp } from "./app/createApp.js";

const start = async () => {
  try {
    await connectToDatabase();
    const app = createApp();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running at http://localhost:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

start();

