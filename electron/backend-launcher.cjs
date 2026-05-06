async function main() {
  const { app } = require("../backend/dist/app");
  const { getDb } = require("../backend/dist/db/connection");
  const { seedDatabase } = require("../backend/dist/db/seed");
  const { createSchema } = require("../backend/dist/db/schema");

  const db = await getDb();
  await createSchema(db);
  await seedDatabase(db);

  const host = process.env.HOST || "127.0.0.1";
  const port = Number(process.env.PORT || "0");

  const server = app.listen(port, host, () => {
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve local backend port.");
    }

    console.log(`SMART_CLASSROOM_READY:${address.port}`);
  });

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
