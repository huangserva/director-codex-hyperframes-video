#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const skillDir = path.resolve(scriptDir, "..");
const validator = path.join(scriptDir, "validate-recipe.mjs");
const validRecipe = path.join(skillDir, "recipes", "okx-xstocks-laonong-tom-v9.recipe.json");
const invalidRecipe = path.join(os.tmpdir(), `invalid-component-recipe-${process.pid}.json`);

function run(args) {
  return spawnSync(process.execPath, args, {
    cwd: path.resolve(skillDir, "../..", ".."),
    encoding: "utf8"
  });
}

const valid = run([validator, validRecipe]);
if (valid.status !== 0) {
  console.error("Expected valid recipe to pass");
  console.error(valid.stdout);
  console.error(valid.stderr);
  process.exit(1);
}

const recipe = JSON.parse(fs.readFileSync(validRecipe, "utf8"));
recipe.scenes[0].component = "DefinitelyMissingComponent";
fs.writeFileSync(invalidRecipe, JSON.stringify(recipe, null, 2));

const invalid = run([validator, invalidRecipe]);
fs.rmSync(invalidRecipe, { force: true });

if (invalid.status === 0) {
  console.error("Expected unknown component recipe to fail");
  console.error(invalid.stdout);
  process.exit(1);
}

if (!invalid.stderr.includes("DefinitelyMissingComponent") || !invalid.stderr.includes("composer registry")) {
  console.error("Unknown component failure did not include the expected component diagnostics");
  console.error(invalid.stderr);
  process.exit(1);
}

console.log("validate-recipe component lookup test OK");
