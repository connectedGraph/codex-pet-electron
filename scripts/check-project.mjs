import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "package.json",
  "main.js",
  "preload.js",
  "control.html",
  "control.css",
  "control.js",
  "pet.html",
  "pet.css",
  "pet.js",
  "sprite-player.js",
  "assets/codex-spritesheet.webp",
];

let failed = false;
for (const relative of required) {
  const full = path.join(root, relative);
  if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
    console.error(`Missing or empty: ${relative}`);
    failed = true;
  }
}

const asset = fs.readFileSync(path.join(root, "assets/codex-spritesheet.webp"));
if (asset.subarray(0, 4).toString("ascii") !== "RIFF" || asset.subarray(8, 12).toString("ascii") !== "WEBP") {
  console.error("Asset is not a WebP RIFF file");
  failed = true;
}

if (failed) process.exit(1);
console.log("Project structure and WebP signature are valid.");
