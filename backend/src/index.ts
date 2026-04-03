import { app } from "./app";
import { env } from "./config/env";
import { getDb } from "./db/connection";
import { seedDatabase } from "./db/seed";
import { createSchema } from "./db/schema";

async function main() {
  const db = await getDb();
  await createSchema(db);
  await seedDatabase(db);

  app.listen(env.port, () => {
    console.log(`Backend server listening on http://127.0.0.1:${env.port}`);
  });
}

main().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
