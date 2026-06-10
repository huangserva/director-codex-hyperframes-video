# DUIX Remote Submission

This template uses a prepared-job flow when DUIX/HeyGem runs on a separate GPU
host. The flow is intentionally portable across machines and keeps private host
addresses out of Git.

## Pipeline

Run these scripts from `first390-template-locked/`:

1. `scripts/prepare-duix-jobs.mjs`
   Packages each DUIX job locally as `source.mp4` plus `dub.wav` from the project
   manifests and master-audio slice map.
2. `scripts/submit-prepared-duix-jobs.mjs`
   Uploads the prepared bundle to the GPU host with SSH/scp, runs the remote
   runner, downloads completed results, and updates the local job and asset
   manifests.
3. `scripts/remote_run_prepared_duix.py`
   Runs on the GPU host and drives the Docker HeyGem/DUIX service:
   `http://duix-avatar-gen-video:8383/easy/submit` followed by `/easy/query`.

Completion is strict. A job is complete only when `/easy/query` returns:

```text
data.status == 2 && progress == 100
```

The expected result file is `<job_id>-r.mp4`.

## Authentication

DUIX/HeyGem is an offline service and has no API key in this workflow. Access
control is SSH access to the GPU host. The submitter uses local SSH keys through
`ssh` and `scp`; never write SSH passwords, private keys, or private host
addresses into this repository.

## Required Environment

`submit-prepared-duix-jobs.mjs` intentionally fails if `DUIX_HOST` is missing.
Provide it from the shell or the Codex worker environment:

```bash
export DUIX_HOST=<gpu-host>
export DUIX_USER=linux        # optional, defaults to linux
export DUIX_PORT=22           # optional, defaults to 22
export DUIX_RUN_ID=<run-id>   # optional, defaults to hf390_accepted120_tail_v1
```

Before submitting jobs on a new machine, verify SSH non-interactively:

```bash
ssh -o BatchMode=yes -p "${DUIX_PORT:-22}" "${DUIX_USER:-linux}@${DUIX_HOST}" true
```

Only after that succeeds should a persistent shell profile or worker environment
be updated with `DUIX_HOST`.

## Expected Commands

```bash
npm run build:duix-slices
npm run prepare:duix-jobs
DUIX_HOST=<gpu-host> npm run submit:duix-jobs
```

Generated bundles, WAV files, DUIX outputs, and result videos stay out of Git.
