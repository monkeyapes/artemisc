const { execSync } = require("child_process");
const { existsSync } = require("fs");
const { join } = require("path");

const root = __dirname;
const serverDir = join(root, "server");

function run(cmd, cwd = root) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd });
}

function main() {
  console.log("=== Artemisc Boot ===");

  if (!existsSync(join(root, "node_modules"))) {
    run("npm install");
  }

  run("npx prisma generate", serverDir);

  if (!existsSync(join(root, "client", "dist", "index.html"))) {
    try { run("npx vite build", join(root, "client")); } catch (e) { console.log("Client build skipped:", e.message); }
  }

  console.log("=== Starting server ===");
  execSync("npx tsx server/src/index.ts", { stdio: "inherit", cwd: root });
}

try { main(); } catch (e) { console.error("FATAL:", e); process.exit(1); }
