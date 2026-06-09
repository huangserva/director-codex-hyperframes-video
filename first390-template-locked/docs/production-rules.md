# 390s Production Rules

## Hard Rule

The 390s video is an extension of the accepted 2-minute DUIX template, not an
extension of the old 390s scaffold.

The production order is storyboard-first and audio-first. Do not start a final
visual build from the 390s source timeline alone.

Required production order:

1. Finalize `storyboard.md`: full narration, scene storyboard, asset needs,
   caption/SRT policy, and DUIX policy.
2. Export the full narration to `production/full-script-390-vX.txt`.
3. Generate or accept one continuous master narration audio file.
4. Run ASR on that exact final master audio. Use FunASR first for Chinese
   narration; Whisper is only a fallback when FunASR is unavailable.
5. Build the caption timeline from ASR timestamps.
6. Build the DUIX slice map from the same master audio.
7. Fill `data/duix-jobs-manifest.json` with one job record per DUIX output asset.
8. Generate DUIX clips from those audio slices.
9. Classify scenes from the narration purpose.
10. Build visuals with the accepted 2-minute scene components.
11. Burn the ASR-derived caption timeline into HyperFrames as visible subtitle clips.
12. Render muted video layers from HyperFrames.
13. Mux the continuous master audio into the final MP4.

## Roles

- `source.mp4`: timing, topic flow, scene duration, subtitle/narration reference.
- `storyboard.md`: creative source of truth for full narration, scene intent,
  asset needs, SRT/caption policy, and DUIX policy.
- `data/audio-manifest.json`: the production gate for master audio, ASR, captions,
  and DUIX slice map.
- `data/duix-jobs-manifest.json`: the production gate for DUIX source plates,
  driving WAV slices, submit/query jobs, and output mp4 files.
- `first120-template-duix`: visual system, component proportions, motion language.
- `scene-map-390.json`: the only legal bridge between the 390s source and the
  2-minute visual system after the audio pass exists.
- `asset-manifest.json`: the truth table for which moving video assets exist.

## Forbidden Shortcut

Do not paste or reuse the old full-template HTML as production layout. Its placeholder
presenters, screen boxes, proof grids, and random PIP treatment are explicitly
forbidden.

## Video Slot Rule

If a slot is conceptually video, it must eventually become a real moving video asset:

- DUIX presenter clip
- screen recording
- website recording
- proof/result montage video

Until that asset exists, the scene stays non-final.

Planning mode:

```bash
npm run validate:template
```

Final mode:

```bash
npm run validate:final
```

`validate:final` must fail if any required video asset is still marked `todo`.

## Audio Rule

Final production must use one continuous master audio track. DUIX videos remain muted.
Captions must be rebuilt from ASR on the final master audio.
The caption JSON alone is not enough: the generated HyperFrames `index.html` must
contain visible burned-in `.caption-line` clips before a render can be called final.

Final mode must fail unless all of these exist and are marked `exists` in
`data/audio-manifest.json`:

- full narration script
- continuous master audio
- ASR JSON from that master audio
- caption timeline generated from ASR
- DUIX slice map generated from the same master audio

The source audio from `source.mp4` may be used only for analysis or comparison. It
cannot be treated as the final master audio for the new template.

## ASR Rule

For this Chinese tech-talk template, the preferred ASR engine is FunASR:

```bash
node scripts/funasr_transcribe.mjs \
  production/audio/duix-first390-master-v4.wav \
  production/full-script-390-v4.txt \
  production/audio/funasr-duix-first390-master-v4.raw.json \
  production/audio/captions-duix-first390-master-v4.json
```

The FunASR environment is:

```text
/Users/serva/miniconda3/envs/cosyvoice/bin/python
funasr 1.3.9
paraformer-zh + fsmn-vad + ct-punc
```

Caption timings must come from FunASR sentence timestamps. Caption display text may
use the cleaned production script to correct product names such as Codex,
HyperFrames, Claude Code, DUIX, Design.md, and storyboard.md. Do not use a failed
or empty ASR JSON as a valid gate artifact.

## DUIX Job Rule

Every DUIX asset used by the template must have a matching record in
`data/duix-jobs-manifest.json`.

Each new DUIX job must record:

- `asset_slot`
- `scene_ids`
- `slice_id` from the master-audio slice map
- `job_id`
- host or project `source_plate`
- host or project `dub_wav`
- container-visible `container_video_url`
- container-visible `container_audio_url`
- `output_path`
- `status`
- `muted_in_template: true`

The verified DUIX/HeyGem offline call path is:

```text
source.mp4 + dub.wav -> /easy/submit -> /easy/query -> <job_id>-r.mp4
```

Required submit payload defaults:

```json
{
  "watermark_switch": 0,
  "digital_auth": 0,
  "chaofen": 0,
  "pn": 1
}
```

Completion is not `success: true`. Completion requires:

```text
data.status == 2 AND progress == 100
```

Driving audio must be converted to 44.1kHz mono WAV before submission unless a
newer verified deployment proves otherwise.

Use `/Users/serva/.codex/skills/duix-heygem-lipsync/references/api-workflow.md`
for endpoint-level details. Do not write SSH passwords, service tokens, or private
credentials into this template.

## Scene Type Rule

Every scene must declare `scene_type`. The scene type is chosen from the narration
purpose, not from whatever looks convenient in the source video.

Legal scene types:

- `hook_stat`: opening statistic/browser-card impact; component `StatsHero`.
- `title_card`: chapter or concept transition; component `TitleCard`.
- `concept_split`: concept explanation, question, comparison, or key claim;
  component `SplitTextPresenter`.
- `screen_demo_pip`: screen recording or operation demo as the main subject, with a
  moving circular PIP helper; component `ScreenWithPip`.
- `aroll_emphasis`: full-screen presenter emphasis or short transition; component
  `HeroAroll`.
- `step_card`: dark instructional step marker; component `StepCard`.
- `proof_montage`: real result/proof fast cuts; component `ProofMontage`.
- `summary_cta`: final recap or CTA; component `SummaryCta`.

Circular PIP is valid only in `screen_demo_pip` scenes. It is wrong in a
`concept_split` scene because concept scenes use the right-side video column.

Do not add empty HUD circles, empty decorative frames, random PIP treatment, or
visual elements that carry no information.

## HyperFrames Media Rule

Timed videos must be root-level media clips, not nested inside another timed scene
clip. Nested timed videos can freeze during render. The generated preview keeps scene
layout clips and media clips separate to enforce this.
