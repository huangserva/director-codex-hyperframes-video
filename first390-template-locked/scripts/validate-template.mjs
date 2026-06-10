import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const finalMode = process.argv.includes("--final");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(errors, message) {
  errors.push(`ERROR: ${message}`);
}

function warn(warnings, message) {
  warnings.push(`WARN: ${message}`);
}

const lock = readJson("template.lock.json");
const sceneMap = readJson("data/scene-map-390.json");
const manifest = readJson("data/asset-manifest.json");
const audioManifest = readJson("data/audio-manifest.json");
const duixJobsManifest = readJson("data/duix-jobs-manifest.json");
const errors = [];
const warnings = [];

const repoRoot = path.resolve(root, "..");
const acceptedBaselineRequiredFiles = [
  "first120-template-duix/index.html",
  "first120-template-duix/hyperframes.json",
  "first120-template-duix/package.json",
  "first120-template-duix/assets/duix-intro-first10.mp4",
  "first120-template-duix/assets/duix-course-presenter.mp4",
  "first120-template-duix/assets/duix-prompt-pip.mp4",
  "first120-template-duix/assets/duix-first120-audio.m4a",
  "first120-template-duix/docs/duix-cosyvoice-asr-template.md"
];

for (const relativePath of acceptedBaselineRequiredFiles) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(errors, `accepted first120 baseline is missing required file: ../${relativePath}`);
  } else if (fs.statSync(absolutePath).size === 0) {
    fail(errors, `accepted first120 baseline file is empty: ../${relativePath}`);
  }
}

const storyboardPath = path.join(root, "storyboard.md");
if (!fs.existsSync(storyboardPath)) {
  fail(errors, "storyboard.md is missing; production must start from a human-readable storyboard");
} else {
  const storyboard = fs.readFileSync(storyboardPath, "utf8");
  for (const requiredSection of ["## Full Narration", "## Scene Storyboard", "## Caption And SRT Rule", "## DUIX Rule"]) {
    if (!storyboard.includes(requiredSection)) {
      fail(errors, `storyboard.md missing required section: ${requiredSection}`);
    }
  }
  for (const scene of sceneMap.scenes || []) {
    if (!storyboard.includes(`| ${scene.id} |`)) {
      fail(errors, `storyboard.md missing scene row for ${scene.id}`);
    }
  }
}

const allowed = new Set(lock.allowed_components);
const assets = manifest.assets || {};
const scenes = sceneMap.scenes || [];
const sceneTypeContracts = lock.scene_type_contracts || {};
const audioItems = audioManifest.items || {};
const ttsPolicy = audioManifest.tts_policy || {};
const duixJobs = duixJobsManifest.jobs || {};

if (sceneMap.duration !== lock.duration) {
  fail(errors, `scene-map duration ${sceneMap.duration} does not match lock duration ${lock.duration}`);
}

if (!scenes.length) {
  fail(errors, "scene-map has no scenes");
}

const approvedTtsProviders = new Set(ttsPolicy.approved_providers || []);
if (!ttsPolicy.default_provider) {
  fail(errors, "audio-manifest missing tts_policy.default_provider");
} else if (!approvedTtsProviders.has(ttsPolicy.default_provider)) {
  fail(errors, `tts_policy.default_provider ${ttsPolicy.default_provider} is not in approved_providers`);
}

for (const requiredProvider of ["remote_cosyvoice3_master_api", "local_cosyvoice3_zero_shot"]) {
  if (!approvedTtsProviders.has(requiredProvider)) {
    fail(errors, `tts_policy.approved_providers missing ${requiredProvider}`);
  }
}

const forbiddenTtsProviders = new Set(ttsPolicy.forbidden_providers || []);
for (const forbidden of ["mimo", "xiaomi_tts", "macos_say_voice_conversion"]) {
  if (!forbiddenTtsProviders.has(forbidden)) {
    fail(errors, `tts_policy.forbidden_providers missing ${forbidden}`);
  }
}

const remoteCosy = ttsPolicy.remote_cosyvoice3_master_api || {};
for (const [field, expected] of [
  ["base_url_env", "COSYVOICE3_MASTER_API_BASE_URL"],
  ["health_endpoint", "/health"],
  ["tts_endpoint", "/tts"]
]) {
  if (remoteCosy[field] !== expected) {
    fail(errors, `remote_cosyvoice3_master_api.${field} must be ${expected}`);
  }
}
if (!String(remoteCosy.download_rule || "").includes("download_url")) {
  fail(errors, "remote_cosyvoice3_master_api.download_rule must mention download_url");
}
if (!String(remoteCosy.output_format || "").includes("24kHz mono")) {
  fail(errors, "remote_cosyvoice3_master_api.output_format must require 24kHz mono");
}

const localCosy = ttsPolicy.local_cosyvoice3_zero_shot || {};
if (localCosy.python !== "/Users/serva/miniconda3/envs/cosyvoice/bin/python") {
  fail(errors, "local_cosyvoice3_zero_shot.python must use the verified cosyvoice conda python");
}
if (!String(localCosy.required_pythonpath || "").includes("cosyvoice_tf4513")) {
  fail(errors, "local_cosyvoice3_zero_shot.required_pythonpath must pin the verified runtime");
}

for (const [id, item] of Object.entries(audioItems)) {
  if (item.required_for_final !== true) continue;
  if (id === "master_audio") {
    if (!item.tts_provider) {
      fail(errors, "audio-manifest master_audio missing tts_provider");
    } else if (!approvedTtsProviders.has(item.tts_provider)) {
      fail(errors, `audio-manifest master_audio uses unapproved tts_provider ${item.tts_provider}`);
    }
  }
  if (item.status === "exists") {
    if (!item.path) {
      fail(errors, `audio-manifest ${id} says exists but path is empty`);
    } else {
      const itemPath = path.resolve(root, item.path);
      if (!fs.existsSync(itemPath)) {
        fail(errors, `audio-manifest ${id} says exists but file is missing: ${item.path}`);
      }
    }
  } else if (item.status === "todo") {
    const message = `audio-manifest ${id} is TODO; audio-first production gate is not complete`;
    if (finalMode) {
      fail(errors, message);
    } else {
      warn(warnings, message);
    }
  } else {
    fail(errors, `audio-manifest ${id} has unknown status ${item.status}`);
  }
}

if (audioItems.caption_timeline?.status === "exists") {
  const captionPayload = readJson(audioItems.caption_timeline.path);
  const captions = captionPayload.captions || [];
  if (!captions.length) {
    fail(errors, "caption_timeline exists but has no captions");
  } else {
    const first = captions[0];
    const last = captions[captions.length - 1];
    if (first.start > 0.5) {
      fail(errors, `caption_timeline starts too late at ${first.start}`);
    }
    if (Math.abs(last.end - lock.duration) > 1) {
      fail(errors, `caption_timeline ends at ${last.end}; expected near ${lock.duration}`);
    }
    for (let i = 0; i < captions.length; i += 1) {
      const caption = captions[i];
      if (!Number.isFinite(caption.start) || !Number.isFinite(caption.end) || caption.end <= caption.start) {
        fail(errors, `caption ${i} has invalid timing ${caption.start}-${caption.end}`);
      }
      if (!caption.text || !caption.text.trim()) {
        fail(errors, `caption ${i} has empty text`);
      }
      if (i > 0 && caption.start < captions[i - 1].start) {
        fail(errors, `caption ${i} starts before previous caption`);
      }
    }
  }
}

let duixSliceMap = null;
if (audioItems.duix_slice_map?.status === "exists") {
  duixSliceMap = readJson(audioItems.duix_slice_map.path);
  if (duixSliceMap.source_master_audio !== audioItems.master_audio?.path) {
    fail(
      errors,
      `duix_slice_map source ${duixSliceMap.source_master_audio} does not match master audio ${audioItems.master_audio?.path}`
    );
  }
}

for (const [assetSlot, asset] of Object.entries(assets)) {
  if (!asset.type.includes("duix")) continue;
  const job = duixJobs[assetSlot];
  if (!job) {
    fail(errors, `DUIX asset ${assetSlot} has no job record in data/duix-jobs-manifest.json`);
    continue;
  }
  if (job.asset_slot !== assetSlot) {
    fail(errors, `DUIX job ${assetSlot} asset_slot mismatch: ${job.asset_slot}`);
  }
  if (job.muted_in_template !== true) {
    fail(errors, `DUIX job ${assetSlot} must set muted_in_template true`);
  }
  if (!job.slice_id) {
    fail(errors, `DUIX job ${assetSlot} is missing slice_id`);
  } else if (duixSliceMap) {
    const slice = duixSliceMap.slices?.[job.slice_id];
    if (!slice) {
      fail(errors, `DUIX job ${assetSlot} references missing slice_id ${job.slice_id}`);
    } else {
      const wavPath = path.resolve(root, slice.wav);
      if (!fs.existsSync(wavPath)) {
        fail(errors, `DUIX slice ${job.slice_id} wav is missing: ${slice.wav}`);
      }
      if (!slice.asset_slots?.includes(assetSlot)) {
        fail(errors, `DUIX slice ${job.slice_id} does not include asset slot ${assetSlot}`);
      }
    }
  }

  const finalRequired = asset.status === "exists" && job.status !== "legacy_exists";
  if (job.status === "todo") {
    const message = `DUIX job ${assetSlot} is TODO; gen-video job is not complete`;
    if (finalMode) {
      fail(errors, message);
    } else {
      warn(warnings, message);
    }
  } else if (job.status === "legacy_exists") {
    if (!job.output_path) {
      fail(errors, `legacy DUIX job ${assetSlot} is missing output_path`);
    } else {
      const outputPath = path.resolve(root, job.output_path);
      if (!fs.existsSync(outputPath)) {
        fail(errors, `legacy DUIX job ${assetSlot} output is missing: ${job.output_path}`);
      }
    }
  } else if (job.status === "prepared" || job.status === "submitted" || job.status === "rendering") {
    const message = `DUIX job ${assetSlot} status is ${job.status}; completion requires data.status == 2 and progress == 100`;
    if (finalMode) {
      fail(errors, message);
    } else {
      warn(warnings, message);
    }
  } else if (job.status === "complete") {
    for (const field of ["job_id", "source_plate", "dub_wav", "container_video_url", "container_audio_url", "output_path"]) {
      if (!job[field]) {
        fail(errors, `complete DUIX job ${assetSlot} is missing ${field}`);
      }
    }
    if (job.output_path) {
      const outputPath = path.resolve(root, job.output_path);
      if (!fs.existsSync(outputPath)) {
        fail(errors, `complete DUIX job ${assetSlot} output is missing: ${job.output_path}`);
      }
    }
  } else {
    fail(errors, `DUIX job ${assetSlot} has unknown status ${job.status}`);
  }

  if (finalMode && finalRequired && job.status !== "complete") {
    fail(errors, `DUIX asset ${assetSlot} is final asset but job status is ${job.status}, not complete`);
  }
}

let cursor = 0;
for (const scene of scenes) {
  if (!scene.scene_type) {
    fail(errors, `${scene.id} is missing scene_type`);
  } else {
    const sceneTypeContract = sceneTypeContracts[scene.scene_type];
    if (!sceneTypeContract) {
      fail(errors, `${scene.id} uses unknown scene_type ${scene.scene_type}`);
    } else if (sceneTypeContract.component !== scene.component) {
      fail(
        errors,
        `${scene.id} scene_type ${scene.scene_type} requires ${sceneTypeContract.component}, got ${scene.component}`
      );
    }
  }

  if (!allowed.has(scene.component)) {
    fail(errors, `${scene.id} uses non-whitelisted component ${scene.component}`);
  }

  if (Math.abs(scene.start - cursor) > 0.05) {
    warn(warnings, `${scene.id} starts at ${scene.start}; previous scene ended at ${cursor}`);
  }
  if (scene.end <= scene.start) {
    fail(errors, `${scene.id} has invalid duration ${scene.start}-${scene.end}`);
  }
  cursor = scene.end;

  const contract = lock.component_contracts[scene.component];
  if (!contract) {
    fail(errors, `${scene.id} has no component contract for ${scene.component}`);
    continue;
  }

  if (contract.layout && scene.layout !== contract.layout) {
    fail(errors, `${scene.id} layout ${scene.layout} does not match required ${contract.layout}`);
  }

  if (contract.video_required) {
    if (!scene.asset_slot || scene.asset_slot === "none") {
      fail(errors, `${scene.id} uses ${scene.component} but has no asset_slot`);
      continue;
    }
    const asset = assets[scene.asset_slot];
    if (!asset) {
      fail(errors, `${scene.id} references missing asset slot ${scene.asset_slot}`);
      continue;
    }
    if (scene.scene_type === "screen_demo_pip" && !asset.type.includes("screen_recording")) {
      fail(errors, `${scene.id} is screen_demo_pip but asset ${scene.asset_slot} is ${asset.type}`);
    }
    if (scene.scene_type === "concept_split" && asset.type.includes("screen_recording")) {
      fail(errors, `${scene.id} is concept_split but uses screen-demo asset ${scene.asset_slot}`);
    }
    if (asset.type.includes("duix") && asset.muted !== true) {
      fail(errors, `${scene.id}/${scene.asset_slot} is DUIX-related and must be muted`);
    }
    if (asset.status === "exists") {
      const assetPath = path.resolve(root, asset.path);
      if (!fs.existsSync(assetPath)) {
        fail(errors, `${scene.id}/${scene.asset_slot} says exists but file is missing: ${asset.path}`);
      }
    } else if (asset.status === "todo") {
      const message = `${scene.id}/${scene.asset_slot} is TODO; do not render this segment as final`;
      if (finalMode) {
        fail(errors, message);
      } else {
        warn(warnings, message);
      }
    } else {
      fail(errors, `${scene.id}/${scene.asset_slot} has unknown status ${asset.status}`);
    }
  }
}

if (Math.abs(cursor - lock.duration) > 0.05) {
  fail(errors, `last scene ends at ${cursor}; expected ${lock.duration}`);
}

const htmlPath = path.join(root, "index.html");
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, "utf8");
  for (const forbidden of lock.forbidden_in_render_html || []) {
    if (html.includes(forbidden)) {
      fail(errors, `index.html contains forbidden token: ${forbidden}`);
    }
  }
  for (const variable of lock.component_contracts.SplitTextPresenter.css_variables_required) {
    if (!html.includes(variable)) {
      fail(errors, `index.html missing accepted split CSS variable ${variable}`);
    }
  }
  const captionClipCount = (html.match(/class="clip caption-line"/g) || []).length;
  if (finalMode && audioItems.caption_timeline?.status === "exists" && captionClipCount === 0) {
    fail(errors, "index.html has no burned-in caption clips; final render would have no subtitles");
  }
} else {
  warn(warnings, "index.html not present yet; validator checked lock + scene map only");
}

for (const message of warnings) console.log(message);
if (errors.length) {
  for (const message of errors) console.error(message);
  process.exit(1);
}

console.log(`OK: ${scenes.length} scenes validated against ${lock.template}${finalMode ? " in final mode" : ""}`);
console.log(`OK: allowed components only: ${[...allowed].join(", ")}`);
