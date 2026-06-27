---
name: video-master-pipeline
description: Orchestrate reusable end-to-end Chinese presenter video production through project recipes. Use when producing, reproducing, or auditing a video from script to TTS, DUIX/HeyGem lip-sync, HyperFrames composition/render, recipe files, and digital-human registry entries in director-codex-hyperframes-video.
---

# Video Master Pipeline

This is the orchestration skill. It does not replace the production skills below and does not embed project-specific story content. Use it to connect a generic pipeline with a project recipe.

## Mainline

Run the existing skills in this order:

```text
recipe
  -> script-first-video-pipeline
       Copy -> humanizer-zh De-AI Gate -> TTS -> master audio/timeline
  -> duix-heygem-lipsync
       scene WAVs -> source.mp4 + dub.wav -> muted *-r.mp4
  -> hyperframes-tech-talk-template
       manifest/composition -> subtitles -> silent render -> mux final.mp4
```

Responsibilities stay separated:

- `script-first-video-pipeline`: overall copy-first director. It owns script approval, the mandatory `humanizer-zh` 1.5 gate before TTS, voice decision, TTS generation, listening samples, one continuous master audio, per-scene WAVs, and timeline JSON.
- `humanizer-zh`: rewrite/review narration text before TTS so it sounds like a human script. Keep facts, terms, attribution, and pronunciation markers intact.
- `duix-heygem-lipsync`: DUIX/HeyGem mouth-sync job preparation, submit/query, fish-speech or clone-engine notes, partial scene reruns, and muted `*-r.mp4` outputs.
- `hyperframes-tech-talk-template`: composition, registered components, screen-recording scenes, known-text forced-aligned captions, lint/inspect/render, final mux, and frame audit.

## File Interface Contract

All videos should pass artifacts between stages using stable files. A recipe declares the expected locations; the producing stage creates them.

| Stage | Input | Output |
| --- | --- | --- |
| Script | brief/source material + recipe scene plan | `production/<project>/full-script-vN.txt` |
| TTS | approved script + voice reference/voice id | `production/<project>/audio/<project>-master.wav` |
| Timeline | master audio + scene plan | `production/<project>/audio/<project>-timeline.json` |
| Scene audio | master/timeline or per-scene TTS | `production/<project>/audio/scenes/<scene>.wav` |
| Captions | known script text + final audio + timeline | `production/<project>/audio/captions-<project>.json` |
| DUIX | `source.mp4` plate + scene `dub.wav` | `production/<project>/duix-results/<scene>-r.mp4` muted |
| Composition | recipe + manifest + assets + DUIX results + captions | `index-<project>.html` and optional isolated render project |
| Render | composition HTML | `render/<project>-silent.mp4` |
| Final mux | silent render + continuous master audio | `render/<project>-final.mp4` |

Do not let final audio come from DUIX clips, screen recordings, or browser-rendered audio. Final sound is the single continuous master track.

## Decision Points

Make these decisions explicitly and record them in the recipe or report. The detailed rules live in the child skills; link to them instead of duplicating them here.

- Voice: standard narrator vs character voice, approved reference audio, clone engine, sample approval. See `script-first-video-pipeline` and `duix-heygem-lipsync`.
- Script: approved version, humanizer status, pronunciation markers, forbidden claims. See `script-first-video-pipeline` and `humanizer-zh`.
- Captions: default to known-text forced alignment against final audio, constrained by scene timeline. See `hyperframes-tech-talk-template`.
- Digital human: registry id, presenter plate, PIP plate, recommended voice, scene reuse. See `digital-humans-registry.json`.
- Scene freeze/reuse: freeze accepted scene audio/DUIX/layout, rerun only changed scenes, then retime downstream from the new timeline. See `script-first-video-pipeline`, `duix-heygem-lipsync`, and `hyperframes-tech-talk-template`.
- Visual components: only use registered components or approved project components. Do not invent a new layout in render code; add it to the component system first.
- Screen recordings: mute them, fit/crop without stretching, single PIP, hold final frame if short, and verify key UI is not covered. See `hyperframes-tech-talk-template`.

## Recipe Mechanism

Recipes live in `recipes/*.recipe.json`. A recipe is the concrete production map for one video. It must contain:

- `project_id`: stable id used in filenames and reports.
- `title`: human-readable title.
- `base_dir`: repo-relative working project root, normally `first390-template-locked`.
- `digital_human.id`: id from `digital-humans-registry.json`.
- `voice`: either a reference audio path, a voice id, or both.
- `script`: approved script path and version.
- `audio`: master audio, timeline, captions, and per-scene WAV directory.
- `visuals`: composition HTML, manifest, silent/final render paths, dimensions, fps.
- `screen_assets`: named screen recordings or held variants.
- `scenes[]`: ordered scene list. Each scene maps narration text to one of these scene structures:
  - `presenter_full`: full-screen digital human.
  - `component_pip`: registered component plus one presenter PIP.
  - `screen_recording_pip`: screen recording plus one presenter PIP.
  - `chapter_card`: chapter/interstitial card.
  - `summary`: closing recap/CTA.
- `outputs`: final filenames.
- `validation`: expected commands and audit frame points.

Validate a recipe before using it:

```bash
node codex-skills/video-master-pipeline/scripts/validate-recipe.mjs \
  codex-skills/video-master-pipeline/recipes/<project>.recipe.json
```

The validator checks recipe shape, duplicate scene ids, digital-human registry references, declared voice/reference paths, script/audio/manifest/screen/DUIX asset paths, and output naming.

## Digital-Human Registry

`digital-humans-registry.json` is the small git-tracked index of approved digital-human identities. It contains only metadata and small reference-image paths. Large MP4 plates stay outside Git or under ignored paths.

Asset convention:

```text
codex-skills/video-master-pipeline/digital-humans/<id>/
  reference.png                 # small image allowed in Git
  plates/presenter.mp4          # large, ignored
  plates/pip.mp4                # large, ignored
```

Registry entries may also point to existing production assets when those are already the accepted source of truth. Do not copy big videos into the skill directory just to satisfy the registry.

## Reproducing A Video From A Recipe

1. Load the recipe and run the validator.
2. Read the referenced production script. If the script is not approved, stop in `script-first-video-pipeline` before TTS.
3. Run `script-first-video-pipeline` to produce or verify `master.wav`, timeline, scene WAVs, and listening evidence.
4. Use the recipe's `digital_human.id` to pick presenter/PIP plates from the registry.
5. Run `duix-heygem-lipsync` only for missing or changed scene mouth-sync outputs. Reuse frozen `*-r.mp4` for unchanged scenes.
6. Run `hyperframes-tech-talk-template` to compose from the recipe/manifest, rebuild known-text forced captions, render silent video, and mux the master audio.
7. Run validator/final gates, HyperFrames lint/inspect, ffprobe, and recipe audit frames.
8. Report changed files, final paths, validation results, and any drift from the recipe.

If a new video cannot be represented by existing recipe fields or registered components, write the smallest proposal first. Do not smuggle project-specific one-off logic into this master skill.
