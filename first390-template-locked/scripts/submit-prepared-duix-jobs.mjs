import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const host = process.env.DUIX_HOST;
const user = process.env.DUIX_USER || "linux";
const port = process.env.DUIX_PORT || "22";
const runId = process.env.DUIX_RUN_ID || "hf390_accepted120_tail_v1";
const remoteHome = process.env.DUIX_REMOTE_HOME || `/home/${user}`;
const remoteUploadRoot = `${remoteHome}/duix_upload/${runId}`;
const remoteRunRoot = `${remoteHome}/duix_runs/${runId}`;
const localSubmitRoot = path.join(projectRoot, "production/duix-submit", runId);
const localResultsRoot = path.join(projectRoot, "production/duix-results");

const jobsPath = path.join(projectRoot, "data/duix-jobs-manifest.json");
const assetPath = path.join(projectRoot, "data/asset-manifest.json");
const jobsManifest = JSON.parse(fs.readFileSync(jobsPath, "utf8"));
const assetManifest = JSON.parse(fs.readFileSync(assetPath, "utf8"));

if (!host) {
  throw new Error("DUIX_HOST is required. Do not hard-code private server addresses in this repository.");
}

const jobs = Object.entries(jobsManifest.jobs)
  .filter(([, job]) => job.status === "prepared" || job.status === "submitted")
  .map(([assetSlot, job]) => ({ asset_slot: assetSlot, ...job }));

if (jobs.length === 0) {
  console.log("no prepared DUIX jobs to submit");
  process.exit(0);
}

for (const job of jobs) {
  for (const key of ["source_plate", "dub_wav", "job_id", "output_path"]) {
    if (!job[key]) throw new Error(`job ${job.asset_slot} missing ${key}`);
  }
  for (const localPath of [job.source_plate, job.dub_wav]) {
    const fullPath = path.join(projectRoot, localPath);
    if (!fs.existsSync(fullPath)) throw new Error(`missing ${job.asset_slot}: ${localPath}`);
  }
}

fs.mkdirSync(localSubmitRoot, { recursive: true });
fs.mkdirSync(localResultsRoot, { recursive: true });
const jobsJsonPath = path.join(localSubmitRoot, "jobs-to-submit.json");
fs.writeFileSync(jobsJsonPath, `${JSON.stringify(jobs, null, 2)}\n`, "utf8");

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`);
}

const tarPath = path.join(localSubmitRoot, "prepared-duix-jobs.tgz");
const tarInputs = [
  path.relative(projectRoot, jobsJsonPath),
  "scripts/remote_run_prepared_duix.py",
  ...jobs.flatMap((job) => [job.source_plate, job.dub_wav]),
];
run("tar", ["-czf", tarPath, ...tarInputs], { cwd: projectRoot });

const sshTarget = `${user}@${host}`;
const sshArgs = ["-o", "BatchMode=yes", "-p", port, sshTarget];
const scpArgs = ["-o", "BatchMode=yes", "-P", port];

run("ssh", [...sshArgs, `rm -rf ${remoteUploadRoot} && mkdir -p ${remoteUploadRoot} ${remoteRunRoot}`]);
run("scp", [...scpArgs, tarPath, `${sshTarget}:${remoteUploadRoot}/prepared-duix-jobs.tgz`]);
run("ssh", [...sshArgs, `tar -xzf ${remoteUploadRoot}/prepared-duix-jobs.tgz -C ${remoteUploadRoot}`]);

const remoteJobsPath = `${remoteUploadRoot}/${path.relative(projectRoot, jobsJsonPath)}`;
const remoteRunner = `${remoteUploadRoot}/scripts/remote_run_prepared_duix.py`;
run("ssh", [
  ...sshArgs,
  [
    "python3",
    remoteRunner,
    "--jobs",
    remoteJobsPath,
    "--upload-root",
    remoteUploadRoot,
    "--run-root",
    remoteRunRoot,
    "--resume",
  ].join(" "),
]);

run("scp", [...scpArgs, `${sshTarget}:${remoteRunRoot}/results/*-r.mp4`, `${localResultsRoot}/`]);
run("scp", [...scpArgs, `${sshTarget}:${remoteRunRoot}/duix-run-summary.json`, path.join(localSubmitRoot, "duix-run-summary.json")]);

const summary = JSON.parse(fs.readFileSync(path.join(localSubmitRoot, "duix-run-summary.json"), "utf8"));
for (const [assetSlot, result] of Object.entries(summary)) {
  const job = jobsManifest.jobs[assetSlot];
  if (!job) continue;
  const localOutput = job.output_path || `production/duix-results/${result.job_id}-r.mp4`;
  if (!fs.existsSync(path.join(projectRoot, localOutput))) {
    throw new Error(`downloaded result missing for ${assetSlot}: ${localOutput}`);
  }
  jobsManifest.jobs[assetSlot] = {
    ...job,
    status: "complete",
    remote_result: result.result,
    output_path: localOutput,
    muted_in_template: true,
  };
  if (assetManifest.assets?.[assetSlot]) {
    assetManifest.assets[assetSlot] = {
      ...assetManifest.assets[assetSlot],
      path: localOutput,
      status: "exists",
      muted: true,
    };
  }
}

fs.writeFileSync(jobsPath, `${JSON.stringify(jobsManifest, null, 2)}\n`, "utf8");
fs.writeFileSync(assetPath, `${JSON.stringify(assetManifest, null, 2)}\n`, "utf8");
console.log(`completed ${Object.keys(summary).length} DUIX jobs`);
