---
name: duix-heygem-lipsync
description: Use the verified DUIX/HeyGem offline digital-human lip-sync workflow. Trigger when Codex needs to submit face2face/video-driven mouth-sync jobs to a locally deployed HeyGem/DUIX gen-video service, prepare source.mp4 plus dub.wav, call /easy/submit, poll /easy/query, handle CosyVoice/LTX-to-DUIX pipelines, document the interface, or troubleshoot known gen-video container issues.
---

# DUIX HeyGem Lip Sync

Use this skill for the verified offline lip-sync path:

`CosyVoice cloned voice -> LTX/source video -> source.mp4 + dub.wav -> gen-video /easy/submit -> /easy/query -> <job_id>-r.mp4`

## Hard Rules

- Address the user as `黄总`.
- Do not store SSH passwords, tokens, or private credentials in skill files, logs, scripts, or final answers.
- Prefer the verified local `gen-video` interface for offline lip-sync work. Do not confuse it with the DUIX H5/Web SDK real-time interaction path.
- Treat `/easy/query` carefully: `success: true` is not completion. Completion requires `data.status == 2` and `progress == 100`.
- Convert driving audio to `44.1kHz mono WAV` before submission unless a newer verified deployment proves otherwise.
- Put files where the `duix-avatar-gen-video` container can read them, usually under `/code/data/jobs/<job_id>/`.
- Avoid aggressive polling because `gen-video` can block query while rendering.

## Use The Reference

Read `references/api-workflow.md` before submitting or documenting a DUIX/HeyGem job. It contains:

- Verified service topology
- Submit/query payloads
- Audio conversion command
- Docker/container path rules
- Known pitfalls
- Official doc/source links checked on 2026-06-08

## Script

Use `scripts/duix_submit_poll.py` to submit and poll when HTTP access to the gen-video service is available:

```bash
python3 /Users/serva/.codex/skills/duix-heygem-lipsync/scripts/duix_submit_poll.py \
  --base-url http://127.0.0.1:8383 \
  --code <job_id> \
  --video-url /code/data/jobs/<job_id>/source.mp4 \
  --audio-url /code/data/jobs/<job_id>/dub.wav
```

The script intentionally accepts endpoint/path arguments but no SSH password.

## Prepared Remote Submission Pipeline

When a project provides DUIX job scripts under its own `scripts/` directory, prefer the prepared-job pipeline for cross-machine reuse:

1. `prepare-duix-jobs.mjs` runs locally and packages each job as `source.mp4` plus `dub.wav`.
2. `submit-prepared-duix-jobs.mjs` uploads prepared job bundles to the GPU host with SSH/scp and starts the remote runner.
3. `remote_run_prepared_duix.py` runs on the GPU host, drives the Docker HeyGem/DUIX service at `http://duix-avatar-gen-video:8383/easy/submit` and `/easy/query`, waits for `data.status == 2 && progress == 100`, then pulls `<job_id>-r.mp4` back into the local project.

This offline DUIX/HeyGem path has no API key. Access control is SSH access to the GPU host. The local machine may have SSH keys such as `~/.ssh/id_ed25519` and `~/.ssh/id_rsa`, but never copy, print, or store private key contents.

`DUIX_HOST` is intentionally not hard-coded by the repository. `submit-prepared-duix-jobs.mjs` should fail fast if `DUIX_HOST` is missing. Before submitting jobs on a fresh machine:

1. Obtain the GPU host address, username, and port if not the default `linux` / `22`.
2. Verify SSH non-interactively with `ssh -o BatchMode=yes`.
3. Only after verification, set `DUIX_HOST` in the shell environment or shell profile used by Codex workers.
4. Do not assume SSH authorization just because local key files exist.

## Validation Before Claiming Success

1. Confirm `source.mp4` and `dub.wav` exist inside the container-readable job directory.
2. Submit payload to `/easy/submit`.
3. Poll `/easy/query?code=<job_id>` until `status == 2` and `progress == 100`.
4. Confirm `<job_id>-r.mp4` exists and is playable.
5. If audio/video sync matters, sample at least two mouth-open/close moments before saying it is good.
