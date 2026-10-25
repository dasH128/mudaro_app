import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const projectId = process.env.SUPABASE_PROJECT_REF;

if (!projectId) {
  console.error("Define SUPABASE_PROJECT_REF en packages/supabase/.env (ver .env.example)");
  process.exit(1);
}

const types = execFileSync(
  "supabase",
  ["gen", "types", "typescript", "--project-id", projectId, "--schema", "public"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
);

writeFileSync(new URL("../src/database.types.ts", import.meta.url), types);
console.log("Tipos regenerados en packages/supabase/src/database.types.ts");
