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

## Scene Freeze And Partial Re-Runs

When only part of a film changes, do not re-run every DUIX scene by default:

1. Freeze and reuse unchanged `*-r.mp4` result files.
2. Regenerate only changed scene driving audio and changed scene DUIX jobs.
3. Before submitting a changed scene with the same job/code name, clear or replace the remote temp/job directory for that name so `/easy/query` cannot return or recycle an old result.
4. After download, verify the changed scene duration and identity, then let the HyperFrames composition retime downstream scenes from the new timeline.

This pattern keeps accepted scenes stable and avoids accidental visual drift.

## Fish-Speech Voice Clone Engine

Some deployments include a second TTS/voice-clone path beside CosyVoice: the 3090 `duix-avatar-tts` fish-speech container.

Verified EvoMap S1 exploration found this topology:

- Container: `duix-avatar-tts`
- Image: `guiji2025/fish-speech-ziming`
- Entrypoint: `/opt/conda/envs/python310/bin/python3 tools/api_server.py --listen 0.0.0.0:8080`
- Host data directory: `/root/duix_avatar_data/voice/data`
- Container data directory: `/code/data`
- Bind mount: `/root/duix_avatar_data/voice/data -> /code/data`
- Health endpoint inside container: `POST http://127.0.0.1:8080/v1/health`
- Inference endpoint inside container: `POST http://127.0.0.1:8080/v1/invoke`
- Return format: `audio/wav` when `format` is `wav`

Use it as a zero-shot clone engine by placing a clean reference clip and prompt text under the mounted data directory, then posting target text plus reference paths from inside the container. Do not restart the service or edit container configuration during ordinary production.

Minimal request fields:

```json
{
  "text": "target narration text",
  "reference_audio": "/code/data/<job>/ref-24k.wav",
  "reference_text": "exact transcript of the reference audio",
  "format": "wav",
  "chunk_length": 200,
  "max_new_tokens": 2048,
  "top_p": 0.7,
  "repetition_penalty": 1.2,
  "temperature": 0.7,
  "normalize": true,
  "streaming": false,
  "use_memory_cache": "off"
}
```

Example call shape:

```bash
ssh -p <port> <user>@<host> \
  'sudo -n docker exec -i duix-avatar-tts sh -lc "cd /code/data/<job> && /opt/conda/envs/python310/bin/python3 -"' <<'PY'
import pathlib, requests

base = pathlib.Path("/code/data/<job>")
payload = {
    "text": (base / "target.txt").read_text(encoding="utf-8"),
    "reference_audio": str(base / "ref-24k.wav"),
    "reference_text": (base / "ref.prompt.txt").read_text(encoding="utf-8").strip(),
    "format": "wav",
    "chunk_length": 200,
    "max_new_tokens": 2048,
    "top_p": 0.7,
    "repetition_penalty": 1.2,
    "temperature": 0.7,
    "normalize": True,
    "streaming": False,
    "use_memory_cache": "off",
}
response = requests.post("http://127.0.0.1:8080/v1/invoke", json=payload, timeout=900)
response.raise_for_status()
(base / "out.wav").write_bytes(response.content)
PY
```

Reference-audio rules:

- Use a short, clean, single-speaker reference, ideally <=15s, converted to 24kHz mono WAV.
- `reference_text` must be the exact words spoken in the reference audio. Do not add style instructions such as "old", "hoarse", or "dialect" unless those words are actually spoken.
- Treat the output as a TTS candidate until human listening approves it. Fish-speech can preserve timbre/dialect better than CosyVoice in some cases, but it may change pacing and total duration.
- Keep generated candidates in a task-specific namespace so parallel workers do not overwrite each other.

Reference case: `.hive/research/2026-06-18-evomap-fish-speech-s1-candidates.md` documents the 3090 fish-speech S1 candidate workflow.

## Validation Before Claiming Success

1. Confirm `source.mp4` and `dub.wav` exist inside the container-readable job directory.
2. Submit payload to `/easy/submit`.
3. Poll `/easy/query?code=<job_id>` until `status == 2` and `progress == 100`.
4. Confirm `<job_id>-r.mp4` exists and is playable.
5. If audio/video sync matters, sample at least two mouth-open/close moments before saying it is good.
