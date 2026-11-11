import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

let input = "";
for await (const chunk of process.stdin) input += chunk;

function findSourcePath(value) {
  if (typeof value === "string" && /\.(?:ts|tsx)$/.test(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSourcePath(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = findSourcePath(item);
      if (found) return found;
    }
  }
  return null;
}

try {
  const payload = input.trim() ? JSON.parse(input) : {};
  const candidate = findSourcePath(payload);
  if (!candidate) process.exit(0);

  const workspace = resolve(process.cwd());
  const file = resolve(workspace, candidate);
  if (!file.startsWith(`${workspace}${sep}`) || !existsSync(file))
    process.exit(0);

  const result = spawnSync(
    resolve(workspace, "node_modules/.bin/eslint"),
    ["--max-warnings=0", file],
    {
      cwd: workspace,
      stdio: "inherit",
      shell: false,
    },
  );
  process.exit(result.status ?? 1);
} catch {
  process.exit(0);
}
