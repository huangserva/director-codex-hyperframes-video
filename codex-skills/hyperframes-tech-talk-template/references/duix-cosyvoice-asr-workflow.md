# DUIX + CosyVoice + ASR Workflow

This document records the verified method from the 2026-06-08 120s HyperFrames/DUIX rebuild.

## Canonical Context

- Visual reference source video: external `video-template-analysis/source.mp4` when available locally; it is not committed.
- Current digital-human template project: `first120-template-duix/`
- Digital-human source plate: `/Users/serva/Desktop/template3_talk_locked_camera_duix_lipsync.mp4`
- Accepted ASR-caption render from this pass: keep locally under `first120-template-duix/render/` or publish as a Release asset; final renders are not committed.

The visual template is learned from `source.mp4`. The digital-human source plate is only a face/mouth carrier for DUIX and must not be confused with the visual reference.

## Core Principle

Use one continuous master narration track for the whole video.

Do not let sound come from the individual digital-human videos. Digital-human clips are muted visual layers only. Their job is mouth movement, not audio playback.

Correct flow:

1. Copy the working template or use a new render filename. Do not overwrite the last accepted output.
2. Finalize or accept a 120s narration script.
3. Generate one continuous TTS/cloned-voice master audio file.
4. Convert that master audio to the exact final speed and duration.
5. Slice the final master audio at the timestamps where the digital human appears.
6. Convert DUIX driving audio slices to the verified service format, normally 44.1kHz mono WAV.
7. Submit each slice to DUIX/HeyGem to generate corresponding mouth-sync videos. Use the `duix-heygem-lipsync` skill for endpoint-level instructions.
8. Place those mouth-sync videos into the HyperFrames template as muted `<video>` elements.
9. Run ASR on the final master audio and rebuild subtitle timings from ASR timestamps.
10. Confirm no old hand-timed captions remain on the subtitle track.
11. Render video from HyperFrames.
12. Mux the continuous master audio into the rendered MP4.
13. Validate audio, captions, video motion, layout, and sampled frames.

## Why This Is Required

Earlier failures came from mixing systems:

- If audio lives only inside DUIX videos, the video goes silent whenever no digital-human clip is visible.
- If each DUIX clip carries its own audio, playback has audible cuts and inconsistent pacing.
- If captions are hand-timed from the script, they drift after CosyVoice pauses, speed compression, or rewritten text.
- If a long lipsync asset is reused from `data-media-start="0"` in a later scene, the mouth movement is from the wrong moment.
- If old captions are not removed after an ASR replacement, HyperFrames reports overlapping clips or displays the wrong subtitle.
- If a previously accepted render is overwritten, there is no clean comparison target for the user's review.

The final master audio must be the source of truth for both DUIX slices and captions.

## Asset Contract

Current template assets:

- `assets/duix-first120-audio.m4a`: continuous final master audio used in the final mux.
- `assets/duix-intro-first10.mp4`: long intro lipsync asset.
- `assets/duix-intro-browser-card.mp4`: intro browser-card video; when used from 2.63s in the timeline, it must use `data-media-start="2.63"`.
- `assets/duix-course-presenter.mp4`
- `assets/duix-question-presenter.mp4`
- `assets/duix-cta-aroll.mp4`
- `assets/duix-def-open-presenter.mp4`
- `assets/duix-def-stack-presenter.mp4`
- `assets/duix-def-flow-presenter.mp4`
- `assets/duix-def-one-pip.mp4`
- `assets/duix-prompt-pip.mp4`
- `assets/duix-agent-log-pip.mp4`
- `assets/duix-doc-search-pip.mp4`
- `assets/duix-env-check-pip.mp4`

Rule of thumb:

- Per-slot DUIX clips use `data-media-start="0"`.
- Reused long clips must use a source offset matching the timeline moment.
- Every DUIX/video slot stays `muted playsinline`.
- Final audio comes from `assets/duix-first120-audio.m4a` during ffmpeg mux.
- Never store private server credentials, cookies, or tokens in this template. Keep service-specific details in the DUIX lip-sync skill or local secure notes.

## Proven 120s Slot Map

These were the slices used for the current 120s build:

| Slot | Timeline Start | Slice Duration | Output Asset |
| --- | ---: | ---: | --- |
| intro_full | 0.00 | 10.33 | `duix-intro-first10.mp4`, `duix-intro-browser-card.mp4` |
| course | 12.82 | 6.28 | `duix-course-presenter.mp4` |
| question | 22.20 | 4.63 | `duix-question-presenter.mp4` |
| cta_aroll | 26.63 | 6.00 | `duix-cta-aroll.mp4` |
| def_open | 32.43 | 5.87 | `duix-def-open-presenter.mp4` |
| def_stack | 38.22 | 7.08 | `duix-def-stack-presenter.mp4` |
| def_flow | 45.24 | 7.01 | `duix-def-flow-presenter.mp4` |
| def_one_pip | 59.86 | 8.91 | `duix-def-one-pip.mp4` |
| prompt_pip | 68.57 | 16.66 | `duix-prompt-pip.mp4` |
| agent_log_pip | 90.50 | 7.20 | `duix-agent-log-pip.mp4` |
| doc_search_pip | 102.87 | 6.80 | `duix-doc-search-pip.mp4` |
| env_check_pip | 118.30 | 1.70 | `duix-env-check-pip.mp4` |

## Caption Sync

Never preserve hand-timed captions after narration changes.

Run ASR against the final master audio:

```bash
cd first120-template-duix
mkdir -p audit-cosy-master-v2/asr-sync
mlx_whisper assets/duix-first120-audio.m4a \
  --model mlx-community/whisper-large-v3-turbo \
  --language zh \
  --task transcribe \
  --word-timestamps True \
  --output-format json \
  --output-dir audit-cosy-master-v2/asr-sync \
  --output-name duix-first120-large-v3-turbo \
  --verbose False
```

Then rebuild the `caption` clip block in `index.html` from the JSON segment timestamps. Apply only text-normalization fixes such as:

- `Cloud Code` -> `Claude Code`
- `Hyperframes` -> `HyperFrames`
- `FFMPAP` -> `FFmpeg`

Do not alter ASR timestamps unless there is clear evidence.

Known proof point from the 2026-06-08 build:

- Hand-timed subtitle had `HyperFrames 到底是什么` at 18.48s.
- ASR found the spoken phrase at 14.76s-16.08s.
- The hand subtitle was therefore almost 4 seconds late.

## Final Audio Mux

Render first, then mux master audio:

```bash
ffmpeg -y -hide_banner -loglevel error \
  -i render/<rendered-video>.mp4 \
  -i assets/duix-first120-audio.m4a \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a copy -shortest \
  render/<final-output>.mp4
```

Validate audio identity:

```bash
ffmpeg -hide_banner -loglevel error -i render/<final-output>.mp4 -map 0:a:0 -f s16le -acodec pcm_s16le - | md5
ffmpeg -hide_banner -loglevel error -i assets/duix-first120-audio.m4a -map 0:a:0 -f s16le -acodec pcm_s16le - | md5
```

The hashes must match.

## Required QA

Run these before delivery:

```bash
npx --yes hyperframes@0.6.79 lint
npx --yes hyperframes@0.6.79 inspect --at 4,16,24,48,70,105,119 --timeout 180000
ffprobe -v error -show_entries stream=index,codec_type,duration:format=duration,size -of json render/<final-output>.mp4
```

Verify video slots are moving by comparing frame hashes 0.5s apart:

```bash
FINAL="render/<final-output>.mp4"
ffmpeg -hide_banner -loglevel error -ss 16.0 -i "$FINAL" -vf "crop=430:720:1390:160" -frames:v 1 -f rawvideo - | md5
ffmpeg -hide_banner -loglevel error -ss 16.5 -i "$FINAL" -vf "crop=430:720:1390:160" -frames:v 1 -f rawvideo - | md5
```

Hashes should differ for a moving presenter slot.

Minimum frame review points:

- 4s: browser-card proof section, subtitle should match the spoken phrase.
- 16s: left/right presenter section, subtitle should be ASR aligned.
- 18s: transition out of first split section.
- 24s: question/presenter section.
- 48s: accepted split layout.
- 70s and 105s: screen proof plus PIP sections.

Complete acceptance checklist:

| Area | Requirement |
| --- | --- |
| File boundary | New experiment does not overwrite the accepted render |
| Visual source | Visual reference is `source.mp4`, not the digital-human source plate |
| Audio | Final MP4 uses one continuous master narration track |
| DUIX slices | Driving audio slices come from the final master audio |
| DUIX format | Driving slices are converted to 44.1kHz mono WAV unless the deployment proves otherwise |
| Video layers | DUIX videos are muted visual mouth-sync layers |
| Captions | Captions are rebuilt from ASR on the final master audio |
| Caption cleanup | No stale hand-timed caption clips remain |
| Lip sync | Reused long lipsync assets have correct `data-media-start` |
| Visual style | Split layouts, title backgrounds, and browser proof layers match the accepted template |
| QA | lint, inspect, ffprobe, audio hash, frame review, and motion checks all pass |

## Common Failure Modes

- `字幕和说话差距很远`: captions were hand-timed or came from the wrong audio. Re-run ASR on the final master audio.
- `声音不连续`: audio was taken from DUIX video clips. Rebuild using one continuous master audio and mux it into the final MP4.
- `口型对不上`: check whether the video slot uses the correct DUIX slice and `data-media-start`.
- `视频槽不动`: a `<video>` slot was replaced by a still image or frozen asset. Verify with two frames.
- `8秒附近层级乱`: keep one background layer and one foreground subject layer; do not stack multiple semi-transparent foreground panels.
- `左右分栏弱/歪`: use the accepted split layout from `template-spec.md`.
- `11秒背景不统一`: title card must use the unified dark honeycomb background, not a semi-transparent presenter slice.
- `右侧视频黑条/人物不居中`: tune object-fit/crop transform inside the video, not the layout proportions.
