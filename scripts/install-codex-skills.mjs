import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(repoRoot, "codex-skills");
const targetRoot = path.join(os.homedir(), ".codex", "skills");
const force = process.argv.includes("--force");

const requiredSkills = [
  "hyperframes-tech-talk-template",
  "script-first-video-pipeline",
  "duix-heygem-lipsync"
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(sourceRoot)) {
  fail(`missing source skill directory: ${sourceRoot}`);
}

fs.mkdirSync(targetRoot, { recursive: true });

for (const skill of requiredSkills) {
  const src = path.join(sourceRoot, skill);
  const dst = path.join(targetRoot, skill);
  if (!fs.existsSync(path.join(src, "SKILL.md"))) {
    fail(`missing ${skill}/SKILL.md`);
  }
  if (fs.existsSync(dst)) {
    if (!force) {
      console.log(`skip ${skill}: already exists at ${dst} (use --force to replace)`);
      continue;
    }
    fs.rmSync(dst, { recursive: true, force: true });
  }
  fs.cpSync(src, dst, { recursive: true });
  console.log(`installed ${skill} -> ${dst}`);
}

console.log("OK: project Codex skills installed");
