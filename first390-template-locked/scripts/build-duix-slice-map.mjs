import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sceneMapPath = path.join(projectRoot, "data/scene-map-390.json");
const jobsPath = path.join(projectRoot, "data/duix-jobs-manifest.json");
const audioManifestPath = path.join(projectRoot, "data/audio-manifest.json");

const sceneMap = JSON.parse(fs.readFileSync(sceneMapPath, "utf8"));
const jobs = JSON.parse(fs.readFileSync(jobsPath, "utf8")).jobs;
const audioManifest = JSON.parse(fs.readFileSync(audioManifestPath, "utf8"));
const masterAudioRelative = audioManifest.items.master_audio.path;
const outDirRelative = audioManifest.items.duix_slice_map.slice_dir;
const outMapRelative = audioManifest.items.duix_slice_map.path;
const masterAudio = path.join(projectRoot, masterAudioRelative);
const outDir = path.join(projectRoot, outDirRelative);
const outMap = path.join(projectRoot, outMapRelative);
fs.mkdirSync(outDir, { recursive: true });

const scenesById = new Map(sceneMap.scenes.map((scene) => [scene.id, scene]));
const planned = {};

for (const [assetSlot, job] of Object.entries(jobs)) {
  const relatedScenes = (job.scene_ids || [])
    .map((id) => scenesById.get(id))
    .filter(Boolean);
  if (!relatedScenes.length) continue;
  const start = Math.min(...relatedScenes.map((scene) => scene.start));
  const end = Math.max(...relatedScenes.map((scene) => scene.end));
  const duration = Math.max(0, end - start);
  const sliceId = job.slice_id && !job.slice_id.startsWith("todo_")
    ? job.slice_id
    : assetSlot;
  planned[sliceId] ||= {
    slice_id: sliceId,
    asset_slots: [],
    scene_ids: [],
    start: Number.POSITIVE_INFINITY,
    end: 0,
  };
  planned[sliceId].asset_slots.push(assetSlot);
  planned[sliceId].scene_ids.push(...(job.scene_ids || []));
  planned[sliceId].start = Math.min(planned[sliceId].start, start);
  planned[sliceId].end = Math.max(planned[sliceId].end, end);
}

const slices = {};
for (const [sliceId, plan] of Object.entries(planned)) {
  const start = plan.start;
  const end = plan.end;
  const duration = Math.max(0, end - start);
  const wavName = `${sliceId}.wav`.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const wavPath = path.join(outDir, wavName);
  const result = spawnSync("ffmpeg", [
    "-y",
    "-ss",
    String(start),
    "-t",
    String(duration),
    "-i",
    masterAudio,
    "-ac",
    "1",
    "-ar",
    "44100",
    "-c:a",
    "pcm_s16le",
    wavPath,
  ], { stdio: "ignore" });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed for ${sliceId}`);
  }
  slices[sliceId] = {
    slice_id: sliceId,
    asset_slots: [...new Set(plan.asset_slots)],
    scene_ids: [...new Set(plan.scene_ids)],
    start: Number(start.toFixed(3)),
    end: Number(end.toFixed(3)),
    duration: Number(duration.toFixed(3)),
    wav: path.relative(projectRoot, wavPath),
    audio_source: masterAudioRelative,
    format: "44100 Hz mono pcm_s16le wav",
  };
}

const payload = {
  rule: "All DUIX driving WAV slices derive from the continuous 390s master audio.",
  source_master_audio: masterAudioRelative,
  generated_at: new Date().toISOString(),
  slices,
};
fs.writeFileSync(outMap, JSON.stringify(payload, null, 2), "utf8");
console.log(`wrote ${Object.keys(slices).length} slices -> ${path.relative(projectRoot, outMap)}`);
