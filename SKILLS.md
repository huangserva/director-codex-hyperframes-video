# Codex Skills

This repository vendors the project-specific Codex skills required to reproduce
the accepted HyperFrames + DUIX + CosyVoice workflow.

## Required Skills

Install these checked-in skills before producing or repairing this template:

1. `hyperframes-tech-talk-template`
   - Main skill for the accepted dark tech presenter template.
   - Defines the 120s baseline, 390s extension workflow, split layout rules,
     scene-type mapping, motion checks, subtitle rules, and audio/lip-sync gates.

2. `script-first-video-pipeline`
   - Script/TTS-first production rules.
   - Defines copy-first workflow, CosyVoice local fallback, remote CosyVoice3
     master voice API route, TTS listening checks, and audio separation rules.

3. `duix-heygem-lipsync`
   - DUIX/HeyGem offline digital-human lip-sync workflow.
   - Defines prepared job packaging, submit/query polling, completion rule, and
     remote GPU host handoff.

## External Plugin Skills

The following are plugin-provided skills and are not vendored here:

- `hyperframes:hyperframes`
- `hyperframes:hyperframes-cli`
- `hyperframes:gsap`

Install/enable the HyperFrames plugin in Codex for composition authoring, lint,
inspect, and render commands.

## Install

From the repository root:

```bash
node scripts/install-codex-skills.mjs
```

By default the script will not overwrite existing skills. To replace existing
local copies with the repository snapshot:

```bash
node scripts/install-codex-skills.mjs --force
```

## Why These Are In Git

Without these skills, another machine can clone the template assets but still
miss the production rules that made the accepted 120s and 390s versions work.
The vendored skill snapshots are part of the reproducibility contract for this
project.

Do not commit private endpoints, tokens, SSH credentials, cookies, or generated
render outputs into skills. Use environment variables for machine-specific
values such as TTS API bases and DUIX host addresses.

## Machine-Specific Endpoints (.env.local)

Hosts/ports/API bases are NOT hardcoded in skills or scripts. They live in a
gitignored `first390-template-locked/.env.local`, loaded automatically by
`scripts/load-env.mjs` (imported by `remote-cosyvoice3-tts.mjs` and
`submit-prepared-duix-jobs.mjs`). An explicit `export VAR=...` always overrides
the file.

Set up on a new machine:

```bash
cd first390-template-locked
cp .env.example .env.local   # then fill in this machine's values
```

Required variables (see `.env.example`):

- `COSYVOICE3_MASTER_API_BASE_URL` — remote CosyVoice3 master-voice TTS API base.
- `DUIX_HOST` / `DUIX_PORT` / `DUIX_USER` — DUIX/HeyGem GPU host over SSH.

Verify before a full run:

```bash
curl -sS "$COSYVOICE3_MASTER_API_BASE_URL/health"
ssh -o BatchMode=yes -p "$DUIX_PORT" "$DUIX_USER@$DUIX_HOST" true
```
