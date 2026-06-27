---
name: hyperframes-tech-talk-template
description: Build, repair, or extend the reusable HyperFrames dark tech talk video template based on the 2-minute Codex/HyperFrames reference. Use when asked to make a Chinese tech/presenter explainer video with a dark honeycomb HUD style, replicate the source video's motion design, fix left-text/right-presenter split layouts, enforce moving video slots, align subtitles with speech, or audit a HyperFrames render against the accepted template.
---

# HyperFrames Tech Talk Template

Use this skill with `hyperframes:hyperframes` and `hyperframes:hyperframes-cli` when creating or fixing this specific dark tech presenter template.

When this skill is vendored inside `director-codex-hyperframes-video`, the accepted baseline is the checked-in 2-minute DUIX/CosyVoice template:

`first120-template-duix/`

The locked 390.77s extension template is:

`first390-template-locked/`

Use this for any 6m30s / full-source extension. Its `template.lock.json`,
`data/audio-manifest.json`, `data/scene-map-390.json`, `data/asset-manifest.json`, and
`scripts/validate-template.mjs` are the gatekeepers. Do not use the old
`video-template-analysis/hyperframes-full-template` as a layout source.

The visual reference source video is not committed. If available locally, use it only as an external reference:

`video-template-analysis/source.mp4`

## Non-Negotiables

- Address the user as `黄总`.
- Treat the current accepted render as the baseline. Do not redesign the template unless 黄总 explicitly asks.
- Do not overwrite the accepted `first120-template-duix/` baseline in place. Copy it or write a new output filename before experimenting.
- Preserve the unified visual system: black tech background, honeycomb/grid texture, gold primary type, blue secondary accents, translucent dark glass panels.
- Do not add four-corner viewfinder brackets. They were rejected.
- Do not use semi-transparent presenter/video slices as a background. The 11s title card was fixed to use only the unified dark honeycomb background.
- Any slot that is conceptually video must be a moving `<video>`, not a still image. Verify movement by extracting at least two frames from that segment.
- Every left-text/right-presenter split scene must use the accepted split format. Do not invent alternate split proportions.
- Do not force every scene into a split layout. First classify the scene, then use the accepted layout for that scene type.
- Circular PIP is allowed only for screen-demo/operation scenes where the screen recording is the main subject and the PIP is a moving talking-head helper. It must not replace the right video column in concept/explainer scenes.
- Do not add empty HUD circles, decorative empty frames, or visual elements without content/function.
- For DUIX/CosyVoice digital-human versions, final audio must be one continuous master narration track. DUIX videos are muted and used only for mouth movement.
- Never time captions by hand after TTS speed changes. Run ASR on the final master audio and rebuild caption timings from ASR timestamps.
- Caption JSON is not enough. Final HyperFrames HTML must burn the ASR-derived captions into visible subtitle clips, normally `.caption-line`; a final render without visible subtitles is invalid.
- When reusing a longer lipsync video inside a later scene, set `data-media-start` to the correct source offset. The 2.63s browser proof card must read the 2.63s point of the lipsync asset, not 0s.
- Do not overwrite the last accepted render or template when making a new variant. Copy the project or write a new output filename first.
- Do not record SSH passwords, API tokens, cookies, or private service credentials in this skill or template docs. Use `duix-heygem-lipsync` for the verified DUIX job workflow.
- For 390.77s/full-length work, audio is the first production gate. The script, continuous master audio, ASR result, caption timeline, and DUIX slice map must exist before the work can become final.
- For 390.77s/full-length work, the caption timeline must also be present in the render HTML as visible burned-in subtitle clips. `validate:final` must reject an `index.html` with no caption clips.
- For 390.77s/full-length work, run `npm run validate:template` inside `first390-template-locked` before writing render HTML or generating video. Warnings for TODO audio/video assets are allowed only during planning; they are blockers for a final render.
- For 390.77s/full-length final renders, `npm run validate:final` must pass. If it fails, do not present the video as final.
- Timed `<video>` media in generated HyperFrames HTML must be root-level clips, not nested inside another timed clip; nested timed video can freeze in renders.
- For dialect voices, old voices, English-heavy scripts, and brand/model terms, subtitle timing must use known-text forced alignment: align the approved narration text to audio, never use ASR-recognized text as the display source or primary timing anchor.
- When inserting real screen recordings as main scene media, mute the recording and all DUIX slots. The final file still uses one continuous master narration track.
- 1280x720 horizontal explainers and custom presenter identities are valid when the project requires them. Keep the same anti-drift standards: registered components, explicit scene types, visible captions, no face cover, and final lint/inspect/frame review.

## Accepted References

Use these bundled visual references when checking style:

- `assets/reference-title-11s.jpg`: accepted title card after removing the inconsistent presenter-background slice.
- `assets/reference-split-48s.jpg`: accepted left-text/right-presenter split layout.

For detailed layout specs and audit commands, read `references/template-spec.md`.

For the DUIX/CosyVoice/ASR production workflow and known failure modes, read `references/duix-cosyvoice-asr-workflow.md`.

## Workflow

1. If creating a new version, copy `first120-template-duix/` or `first390-template-locked/` to a working project directory first.
2. Locate the source and current HyperFrames project.
3. For 390.77s/full-source extensions, do the audio pass before the visual pass:
   - finalize the full narration script;
   - generate or accept one continuous master audio file;
   - build the caption timeline from the approved script text aligned to that final master audio;
   - build the DUIX slice map from the same master audio.
4. Only after the audio pass, update `first390-template-locked/data/scene-map-390.json`, including `scene_type` for every scene, and update `data/asset-manifest.json`.
5. Generate the render HTML with visible burned-in subtitle clips from the ASR caption timeline. Do not treat a caption JSON file alone as subtitles in the final video.
6. Run `npm run validate:template`; for final production, `npm run validate:final` must also pass.
7. Inspect the user-reported timestamp first. Extract a frame from the current render and compare it to the source/reference.
8. Make the smallest scoped HTML/CSS/GSAP change that fixes the issue.
9. If changing narration, digital-human video, subtitle text, or speed, rebuild the continuous master audio first, regenerate DUIX video slots from slices of that master audio, keep all DUIX video elements muted, then rebuild the caption track from ASR on the final master audio. Confirm no stale old caption clips remain on the subtitle track.
   - Preferred caption rebuild: per-scene known-text forced alignment using timeline scene boundaries. Do not let one scene's timing drift into another scene.
   - If only one scene changes, keep unchanged scene layouts and DUIX outputs frozen, update the timeline, rebuild captions, and shift downstream scene starts according to the new timeline.
10. Run:

```bash
npx --yes hyperframes@0.6.79 lint
npx --yes hyperframes@0.6.79 inspect --at <timestamps> --timeout 120000
```

11. Render review output:

```bash
npx --yes hyperframes@0.6.79 render --fps 30 --quality standard --workers=1 --low-memory-mode --protocol-timeout=900000 --player-ready-timeout=120000 --output render/first120-template.mp4
```

12. Mux the continuous master audio into the rendered MP4 with ffmpeg. Do not trust browser-rendered audio for the final master.
13. Extract review frames with `ffmpeg -ss <time> -frames:v 1`.
14. View the extracted frames before telling 黄总 it is fixed. At least one extracted frame after 120s must visibly show a subtitle when speech is active.

## Split Layout Rule

All `concept_split` left-info/right-presenter scenes must follow the accepted visual hierarchy:

- Left panel is the dominant information block.
- Right presenter panel has the same vertical system as the left panel, not a random smaller or taller box.
- Left text hierarchy: small chip, English kicker, very large Chinese headline with italic/tech emphasis, short subline, 2-3 HUD cards, gold/blue progress line.
- Right video is a portrait crop with gold border and glow. It must fill the frame with no top black strip.
- Presenter should be centered enough that face and shoulders feel intentional. Use `object-fit: cover` plus transform crop if needed.
- Keep `data-layout-allow-overflow` on video elements when transform crop intentionally exceeds the container.

## Scene Type Rule

For 390.77s work, every scene must declare `scene_type` and use the matching accepted component:

- `hook_stat`: `StatsHero`, opening statistic/browser-card impact.
- `title_card`: `TitleCard`, chapter or concept transition on the unified dark honeycomb background.
- `concept_split`: `SplitTextPresenter`, concept explanation, question, comparison, or key claim.
- `screen_demo_pip`: `ScreenWithPip`, screen recording or operation demo as the main subject with a moving circular PIP helper.
- `aroll_emphasis`: `HeroAroll`, full-screen presenter emphasis or short transition.
- `step_card`: `StepCard`, dark instructional step marker.
- `proof_montage`: `ProofMontage`, real result/proof fast cuts.
- `summary_cta`: `SummaryCta`, final recap or CTA.

Do not choose components by visual convenience. Choose scene type from the narration purpose, then use the locked component.

## Horizontal And Custom Presenter Variants

The original accepted system is a dark 1920x1080 tech presenter template, but production work may also use 1280x720 horizontal videos and non-standard presenter identities such as a farmer, founder, or product host. In those cases:

- Keep output dimensions explicit in the manifest and root composition.
- Add the smallest new registered components needed for the subject instead of mutating locked components. Examples include reconstructed Amazon SOP screen UI components and EvoMap warm card components.
- Keep custom components under the same validator discipline: declared props schema, legal scene type, text budget, single PIP where applicable, no face cover, and frame audit before completion.
- Do not force black-gold HUD styling onto a subject where it clashes with the accepted direction; preserve readability and the intended production identity while keeping component boundaries locked.

## Screen Recording Scenes

Use real screen recordings as scene media only when the recording is the subject of the scene, normally with `screen_demo_pip` / `ScreenWithPip`:

- Fit or crop the recording to the target canvas without stretching or changing aspect ratio.
- The recording must be muted. Final audio comes only from the continuous master narration track.
- Use one circular presenter PIP, normally bottom-left, and verify it does not cover buttons, forms, leaderboards, code, or other key UI.
- If the recording is shorter than the scene, clone-hold the final frame to match the scene duration. Do not slow down, loop, or stretch the recording unless 黄总 explicitly asks for that effect.
- Extract frames from the start, middle, and end of each screen-recording scene. Confirm the recording is readable, moving where expected, and not black at the hold point.

## Motion Checks

Do not rely on one screenshot for dynamic sections. Check continuity around:

- 1-4s: statistic/card entrance, zoom-in punch, right-side frame extension.
- 8s: browser/modal layer should be one background layer plus one foreground subject layer; avoid messy stacked overlays.
- 10-12s: title card background must be unified dark honeycomb, with no presenter slice.
- 12-18s: card entrance, right presenter sync, and exit transition.
- 48-52s: accepted split-layout style.
- Any scene with a presenter video: verify it moves.

## Audio, Lip Sync, And Captions

- Treat audio, mouth video, and captions as three separate systems until final assembly.
- The master audio is the source of truth. All subtitle timings and DUIX slices must derive from it.
- The caption timeline must be burned into the visible render. Missing subtitle clips are a final-blocking error even if ASR JSON exists.
- Never let final sound come from individual DUIX video slots; that creates gaps whenever the digital human is off screen.
- DUIX driving audio slices should be converted to the verified service format before submission, normally 44.1kHz mono WAV.
- After any TTS regeneration, speed change, or audio compression, rebuild the caption track from the final audio.
- Default caption timing is known-text forced alignment: feed the approved narration text plus the corresponding audio into a language-specific aligner and use the returned character/token/word timestamps. Display text always comes from the human-approved script; ASR output is timing evidence only.
- Chinese narration uses FunASR `fa-zh` / `speech_timestamp_prediction-v1-16k-offline`.
- English narration uses the local English CTC forced aligner:

```bash
node scripts/known-text-forced-align.mjs input.json output.json
```

  Input shape:

```json
{
  "scenes": [
    {
      "id": "s001",
      "wav": "production/<project>/audio/scenes/s001.wav",
      "text": "Approved English narration for this scene.",
      "lang": "auto"
    }
  ]
}
```

  `lang:auto` selects `zh` for CJK-heavy text and `en` for Latin-heavy text. The English path runs `torchaudio` wav2vec2 CTC `forced_align` from `/Users/huangzongning/CosyVoice/venv/bin/python` by default, with `EN_ALIGN_PYTHON` and `EN_ALIGN_BUNDLE` as overrides. The first run may download/cache the `WAV2VEC2_ASR_BASE_960H` bundle under `~/.cache/torch`; no online production service is changed.
- Align per scene using `audio/*timeline*.json` scene boundaries and per-scene audio slices. This constrains drift and prevents a bad dialect/English recognition segment from pushing downstream subtitles across scene cuts.
- Do not use the old path `ASR recognizes audio -> LCS match to the human script` as the default. It can fail badly on dialect voices, elderly voices, English acronyms, and brand/model names; EvoMap H2 had subtitle drift up to 4.6s from that failure mode.
- Add or keep validator red lines that reject captions marked as recognized-ASR anchors when a known-text forced-alignment source is expected.
- If captions drift by seconds, do not hand nudge every line. Diagnose whether captions were generated from the wrong audio, pre-speed-change timing, recognized-ASR anchors, or cross-scene drift.
- If mouth movement drifts inside a reused long video slot, check `data-media-start` before regenerating DUIX.
- Expected final validation: `lint` has 0 errors, `inspect` has 0 layout issues, final audio PCM hash matches the master audio PCM hash, and every conceptual video slot differs between two frames 0.5s apart.

Reference case: `.hive/research/2026-06-18-evomap-h2-forced-captions.md` documents the EvoMap H2 fix where known-text forced alignment replaced ASR-recognized anchors.

## Final Response

Keep the response concise. Include the changed render path and at least one extracted frame path when visual verification matters. Mention only meaningful validation results, such as `lint 0 error` and `inspect 0 layout issues`.
