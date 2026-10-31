const { execSync } = require("child_process");

// If running in Vercel or with a PostgreSQL connection string, sync the schema
if (
  process.env.VERCEL ||
  process.env.DATABASE_URL?.startsWith("postgres") ||
  process.env.POSTGRES_PRISMA_URL?.startsWith("postgres")
) {
  console.log("Pushing database schema to Neon Postgres...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  } catch (e) {
    console.warn("Warning during prisma db push:", e.message);
  }
}

console.log("Generating Prisma client...");
execSync("npx prisma generate", { stdio: "inherit" });

console.log("Building Next.js app...");
execSync("next build", { stdio: "inherit" });

