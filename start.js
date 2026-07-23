import { execSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function run(cmd, cwd = __dirname) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd });
}

console.log("=== Artemisc Boot ===");

if (!existsSync(join(__dirname, "node_modules"))) {
  run("npm install");
}

if (!existsSync(join(__dirname, "server", "dist", "index.js"))) {
  run("npm run build");
}

console.log("=== Starting server ===");
const { buildApp } = await import("./server/dist/app.js");
const app = await buildApp();
const PORT = parseInt(process.env.PORT || "3001", 10);
await app.listen({ port: PORT, host: "0.0.0.0" });
console.log(`Artemisc running on port ${PORT}`);
