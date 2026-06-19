const { existsSync } = require("fs");
const { join } = require("path");
const { spawnSync } = require("child_process");

const cwd = process.cwd();
const rootSchema = join(cwd, "apps", "backend", "prisma", "schema.prisma");
const localSchema = join(cwd, "prisma", "schema.prisma");
const schema = existsSync(rootSchema) ? rootSchema : localSchema;
const databaseUrl = process.env.DATABASE_URL || "";

console.log("[railway:migrate] cwd:", cwd);
console.log("[railway:migrate] schema:", schema);
console.log("[railway:migrate] DATABASE_URL:", databaseUrl ? describeDatabaseUrl(databaseUrl) : "missing");

if (!databaseUrl) {
  console.error("[railway:migrate] DATABASE_URL is not set.");
  process.exit(1);
}

if (!existsSync(schema)) {
  console.error("[railway:migrate] Prisma schema was not found.");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy", "--schema", schema], {
  cwd,
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

process.exit(result.status || 0);

function describeDatabaseUrl(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "set, but not a valid URL";
  }
}
