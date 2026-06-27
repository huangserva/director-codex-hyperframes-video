#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const skillDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const repoRoot = path.resolve(skillDir, "../..");
const workspaceRoot = path.resolve(repoRoot, "..");
const composerRoot = path.join(workspaceRoot, "hyperframes-composer");
const registryPath = path.join(skillDir, "digital-humans-registry.json");
const composerCatalogPath = path.join(composerRoot, "components", "catalog.json");
const composerRegistryPath = path.join(composerRoot, "components", "registry.mjs");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`cannot read JSON ${filePath}: ${error.message}`);
  }
}

function existsRepoPath(relativePath) {
  if (!relativePath) return true;
  return fs.existsSync(path.resolve(repoRoot, relativePath));
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function requireText(errors, object, key, label) {
  if (!hasText(object?.[key])) errors.push(`${label}.${key} must be a non-empty string`);
}

function requireFile(errors, relativePath, label, { allowEmpty = false } = {}) {
  if (!hasText(relativePath)) {
    if (!allowEmpty) errors.push(`${label} path is empty`);
    return;
  }
  if (!existsRepoPath(relativePath)) errors.push(`${label} does not exist: ${relativePath}`);
}

async function loadComponentVocabulary() {
  const catalog = readJson(composerCatalogPath);
  const { registry } = await import(pathToFileURL(composerRegistryPath).href);
  return {
    catalogIds: new Set((catalog.coarseSceneComponents ?? []).map((component) => component.id)),
    registryIds: new Set(Object.keys(registry ?? {}))
  };
}

function splitComponentSpec(value) {
  if (!hasText(value)) return [];
  return value
    .split(/\s*(?:\+|,|\||\/)\s*/u)
    .map((component) => component.trim())
    .filter(Boolean);
}

function validateComponentReference(errors, scene, key, componentVocabulary) {
  const value = scene?.[key];
  if (!hasText(value)) return;
  for (const component of splitComponentSpec(value)) {
    if (!componentVocabulary.catalogIds.has(component)) {
      errors.push(`scene ${scene.id ?? "<unknown>"}.${key} references component not in composer catalog: ${component}`);
    }
    if (!componentVocabulary.registryIds.has(component)) {
      errors.push(`scene ${scene.id ?? "<unknown>"}.${key} references component not in composer registry: ${component}`);
    }
  }
}

function validateRegistry(registry) {
  const errors = [];
  if (!Array.isArray(registry.humans)) errors.push("registry.humans must be an array");
  const ids = new Set();
  for (const human of registry.humans ?? []) {
    requireText(errors, human, "id", "human");
    requireText(errors, human, "name", `human ${human.id ?? "<unknown>"}`);
    if (ids.has(human.id)) errors.push(`duplicate digital human id: ${human.id}`);
    ids.add(human.id);
    requireFile(errors, human.reference_image, `human ${human.id} reference_image`, { allowEmpty: true });
    requireFile(errors, human.plates?.presenter, `human ${human.id} plates.presenter`);
    requireFile(errors, human.plates?.pip, `human ${human.id} plates.pip`);
    requireFile(errors, human.recommended_voice?.reference_audio, `human ${human.id} recommended_voice.reference_audio`, {
      allowEmpty: true
    });
    requireFile(errors, human.recommended_voice?.prompt_text, `human ${human.id} recommended_voice.prompt_text`, {
      allowEmpty: true
    });
  }
  return { errors, humansById: new Map((registry.humans ?? []).map((human) => [human.id, human])) };
}

function validateRecipe(recipe, humansById, componentVocabulary) {
  const errors = [];
  for (const key of [
    "version",
    "project_id",
    "title",
    "base_dir",
    "digital_human",
    "voice",
    "script",
    "audio",
    "visuals",
    "scenes",
    "outputs",
    "validation"
  ]) {
    if (!(key in recipe)) errors.push(`recipe missing required key: ${key}`);
  }

  requireText(errors, recipe, "project_id", "recipe");
  requireFile(errors, recipe.base_dir, "base_dir");

  const digitalHumanId = recipe.digital_human?.id;
  if (!humansById.has(digitalHumanId)) errors.push(`unknown digital_human.id: ${digitalHumanId}`);

  requireFile(errors, recipe.voice?.reference_audio, "voice.reference_audio", { allowEmpty: Boolean(recipe.voice?.voice_id) });
  requireFile(errors, recipe.voice?.prompt_text, "voice.prompt_text", { allowEmpty: true });
  requireFile(errors, recipe.script?.path, "script.path");
  requireFile(errors, recipe.audio?.master, "audio.master");
  requireFile(errors, recipe.audio?.timeline, "audio.timeline");
  requireFile(errors, recipe.audio?.captions, "audio.captions");
  requireFile(errors, recipe.audio?.scene_wav_dir, "audio.scene_wav_dir");
  requireFile(errors, recipe.visuals?.manifest, "visuals.manifest");
  requireFile(errors, recipe.visuals?.composition_html, "visuals.composition_html");
  requireFile(errors, recipe.visuals?.isolated_html, "visuals.isolated_html", { allowEmpty: true });

  const screenAssets = new Map();
  for (const asset of recipe.screen_assets ?? []) {
    requireText(errors, asset, "id", "screen_asset");
    requireFile(errors, asset.path, `screen_assets.${asset.id}.path`);
    requireFile(errors, asset.hold_variant, `screen_assets.${asset.id}.hold_variant`, { allowEmpty: true });
    screenAssets.set(asset.id, asset);
  }

  if (!Array.isArray(recipe.scenes) || recipe.scenes.length === 0) {
    errors.push("scenes must be a non-empty array");
  }

  const sceneIds = new Set();
  const allowedKinds = new Set(["presenter_full", "component_pip", "screen_recording_pip", "chapter_card", "summary"]);
  for (const scene of recipe.scenes ?? []) {
    requireText(errors, scene, "id", "scene");
    if (sceneIds.has(scene.id)) errors.push(`duplicate scene id: ${scene.id}`);
    sceneIds.add(scene.id);
    if (!allowedKinds.has(scene.kind)) errors.push(`scene ${scene.id} has invalid kind: ${scene.kind}`);
    requireText(errors, scene, "script_ref", `scene ${scene.id}`);
    requireText(errors, scene, "component", `scene ${scene.id}`);
    validateComponentReference(errors, scene, "component", componentVocabulary);
    validateComponentReference(errors, scene, "component_pip", componentVocabulary);
    validateComponentReference(errors, scene, "screen_recording_pip", componentVocabulary);
    if (typeof scene.duration !== "number" || scene.duration <= 0) errors.push(`scene ${scene.id} duration must be > 0`);
    requireFile(errors, scene.scene_wav, `scene ${scene.id}.scene_wav`, { allowEmpty: true });

    if (scene.kind === "presenter_full" || scene.kind === "summary") {
      requireFile(errors, scene.duix_result, `scene ${scene.id}.duix_result`);
    }
    if (scene.kind === "component_pip" || scene.kind === "screen_recording_pip") {
      requireFile(errors, scene.pip_duix_result, `scene ${scene.id}.pip_duix_result`);
    }
    if (scene.kind === "screen_recording_pip") {
      if (!screenAssets.has(scene.screen_asset)) errors.push(`scene ${scene.id} references unknown screen_asset: ${scene.screen_asset}`);
    }
  }

  requireFile(errors, recipe.outputs?.silent, "outputs.silent", { allowEmpty: true });
  requireFile(errors, recipe.outputs?.final, "outputs.final", { allowEmpty: true });

  if (!Array.isArray(recipe.validation?.commands) || recipe.validation.commands.length === 0) {
    errors.push("validation.commands must be a non-empty array");
  }
  if (!Array.isArray(recipe.validation?.audit_frames) || recipe.validation.audit_frames.length === 0) {
    errors.push("validation.audit_frames must be a non-empty array");
  }

  return errors;
}

async function main() {
  const recipePath = process.argv[2];
  if (!recipePath) {
    console.error("Usage: node scripts/validate-recipe.mjs <recipes/project.recipe.json>");
    process.exit(2);
  }

  const registry = readJson(registryPath);
  const componentVocabulary = await loadComponentVocabulary();
  const { errors: registryErrors, humansById } = validateRegistry(registry);
  const recipe = readJson(path.resolve(process.cwd(), recipePath));
  const recipeErrors = validateRecipe(recipe, humansById, componentVocabulary);
  const errors = [...registryErrors, ...recipeErrors];

  if (errors.length > 0) {
    console.error(`Recipe validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Recipe OK: ${recipe.project_id}`);
  console.log(`Digital human: ${recipe.digital_human.id}`);
  console.log(`Scenes: ${recipe.scenes.length}`);
  console.log(`Final output: ${recipe.outputs.final}`);
}

main().catch((error) => {
  console.error(`Recipe validation failed: ${error.message}`);
  process.exit(1);
});
