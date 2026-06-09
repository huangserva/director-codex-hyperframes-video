import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourceTemplate = process.argv[2] || "/Users/serva/Desktop/template3_talk_locked_camera_duix_lipsync.mp4";
const version = "v1";
const jobRoot = path.join(projectRoot, "production/duix-jobs");
const resultRoot = path.join(projectRoot, "production/duix-results");

const jobsPath = path.join(projectRoot, "data/duix-jobs-manifest.json");
const jobsManifest = JSON.parse(fs.readFileSync(jobsPath, "utf8"));
const sliceMap = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "production/audio/duix-slice-map-accepted120-tail-v1.json"), "utf8"),
);

if (!fs.existsSync(sourceTemplate)) {
  throw new Error(`missing source template: ${sourceTemplate}`);
}

fs.mkdirSync(jobRoot, { recursive: true });
fs.mkdirSync(resultRoot, { recursive: true });

function sh(args, label) {
  const result = spawnSync(args[0], args.slice(1), { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${label} failed`);
}

function jobIdFor(assetSlot) {
  return `hf390_${assetSlot}_${version}`.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

let prepared = 0;

for (const [assetSlot, job] of Object.entries(jobsManifest.jobs)) {
  if (job.status !== "todo" && job.status !== "prepared") continue;
  const slice = sliceMap.slices?.[job.slice_id];
  if (!slice) throw new Error(`missing slice for ${assetSlot}: ${job.slice_id}`);

  const jobId = job.job_id || jobIdFor(assetSlot);
  const dir = path.join(jobRoot, jobId);
  fs.mkdirSync(dir, { recursive: true });

  const sourceOut = path.join(dir, "source.mp4");
  const dubOut = path.join(dir, "dub.wav");
  const sliceWav = path.join(projectRoot, slice.wav);
  const duration = Math.max(0.5, Number(slice.duration) + 0.25);

  sh([
    "ffmpeg",
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    sourceTemplate,
    "-t",
    String(duration),
    "-an",
    "-vf",
    "scale=1280:704,setsar=1",
    "-r",
    "25",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    sourceOut,
  ], `source render for ${assetSlot}`);

  sh([
    "ffmpeg",
    "-y",
    "-i",
    sliceWav,
    "-ac",
    "1",
    "-ar",
    "44100",
    "-c:a",
    "pcm_s16le",
    dubOut,
  ], `dub wav for ${assetSlot}`);

  jobsManifest.jobs[assetSlot] = {
    ...job,
    job_id: jobId,
    source_plate: path.relative(projectRoot, sourceOut),
    dub_wav: path.relative(projectRoot, dubOut),
    container_video_url: `/code/data/jobs/${jobId}/source.mp4`,
    container_audio_url: `/code/data/jobs/${jobId}/dub.wav`,
    output_path: path.relative(projectRoot, path.join(resultRoot, `${jobId}-r.mp4`)),
    status: "prepared",
    muted_in_template: true,
  };
  prepared += 1;
}

fs.writeFileSync(jobsPath, `${JSON.stringify(jobsManifest, null, 2)}\n`, "utf8");
console.log(`prepared ${prepared} DUIX jobs in ${path.relative(projectRoot, jobRoot)}`);
