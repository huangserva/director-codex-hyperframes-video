# 390s Script Cleaning Notes

## Purpose

This note records how `full-script-390-v4.txt` was derived so the 390s build can
be audited later. The script is the first gate for the locked 390s template.

## Inputs Checked

- Accepted first-120 narration:
  `duix-replacement/cosyvoice-preview/full_120_script_v2.txt`
- Source timeline and ASR reference:
  `video-template-analysis/docs/transcript/source.srt`
- Locked scene map:
  `first390-template-locked/data/scene-map-390.json`

## Cleaning Rules

- Keep the accepted first-120 meaning and tone.
- Use the 390.77s source only for topic order and timing intent.
- Fix obvious ASR/OCR errors before TTS:
  - `口波` -> `口播`
  - `高仅感` -> `高级感`
  - `Cloud Code` -> `Claude Code`
  - `HDML` -> `HTML`
  - `FF和Mpick` -> `FFmpeg`
  - `Chromes` -> `Chrome`
  - `圆形设计` where context means page/design prototype -> `原型设计`
  - `Scale` -> `Skill`
  - `A正在` -> `Agent`
  - `分禁` -> `分镜`
  - `画面目准` -> `画面目标`
  - `生生` -> `生成`
  - `验子` -> `验证`
- Do not directly reuse the old failed 390s scaffold wording as a visual rule.
- Mention the audio-first DUIX rule explicitly because it is the main production
  failure mode discovered in the previous attempt.

## Timing Intent

The accepted 120s script is about 2092 characters and produced a 120.016s master
audio. `full-script-390-v1.txt`, `full-script-390-v2.txt`, and
`full-script-390-v3.txt` were too long for a 390s voice pass, so v4 is the
production script. If generated TTS is off by more than a small tolerance, adjust
from the continuous master, then rerun ASR and rebuild captions/DUIX slices.
