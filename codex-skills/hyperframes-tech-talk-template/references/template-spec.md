# Template Spec

This skill captures the accepted 2-minute dark tech talk template for HyperFrames.

## Canonical Files

- Accepted DUIX/CosyVoice baseline project: `first120-template-duix/`
- Source HTML: `first120-template-duix/index.html`
- Continuous reference audio: `first120-template-duix/assets/duix-first120-audio.m4a`
- Visual reference original: external `video-template-analysis/source.mp4` when available locally; it is not committed.
- Locked 390.77s extension project: `first390-template-locked/`
- Current accepted render: not committed; keep renders under `render/` or GitHub Releases.

When starting a new template version, copy the bundled snapshot out first:

```bash
cp -R first120-template-duix <new-working-dir>
```

Do not modify the accepted baseline directly.

For digital-human variants, start from `first120-template-duix` when available. It preserves the accepted visual system while replacing presenter footage with DUIX-generated mouth-sync clips and ASR-aligned captions.

## Visual System

- Canvas: 1920x1080, dark black base.
- Background: black/near-black, subtle honeycomb, gold radial glow around text, blue radial glow as secondary depth.
- Typography: bold italic tech feel; gold English kickers; large white/gold Chinese headlines.
- Panels: dark glass, low-opacity borders, gold/blue accent lines.
- Avoid: corner viewfinder brackets, random presenter-video background slices, unrelated red proof boxes, messy multi-layer overlays.

## Accepted Split Layout

Use the current `#root` split variables as the system of record:

```css
--split-x: 120px;
--split-left: 1190px;
--split-gap: 60px;
--split-video: 430px;
--split-total: 1680px;
--split-top: 126px;
--split-height: 690px;
--split-left-pad-x: 74px;
--split-card-y: 442px;
```

For course/question/definition style scenes:

- Left panel begins near x=120, y=126.
- Right presenter begins after left width + gap.
- Left and right blocks should feel vertically aligned and intentionally paired.
- Right panel must not have empty black bands inside the video crop.
- If the presenter is off-center, tune the video crop, not the container proportions.

Recommended video crop pattern:

```css
.course-presenter video,
.q-map-presenter video,
.def-open .def-presenter video,
.def-stack .def-presenter video,
.def-flow .def-presenter video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.14) translate(-2.4%, -3.6%);
  transform-origin: center center;
}
```

Add `data-layout-allow-overflow` to these transformed video tags so `inspect` does not report intentional crop overflow.

## Scene-Specific Notes

### 10.13-12.82 Title Card

Accepted fix: remove the old `.title-slice` presenter image layer and its GSAP animation. Use only the common `.scene` background.

### Left/Right Split Scenes

Do not use the weaker layout where the left side has scattered text, a small right video, or disconnected empty rectangles. Use the reference split: one strong left information panel, one right presenter panel.

### Video Slots

If the visual block represents a video, use a `<video>` asset and timeline timing. Do not freeze it as an image. Verify with two frames:

```bash
ffmpeg -y -ss <t> -i render/first120-template.mp4 -frames:v 1 audit-video-slots/<name>-a.jpg
ffmpeg -y -ss <t_plus_0.5> -i render/first120-template.mp4 -frames:v 1 audit-video-slots/<name>-b.jpg
```

Then view both frames and confirm internal motion, not only scene-level motion.

### DUIX/CosyVoice Audio Contract

Digital-human variants must keep one continuous master audio track in `assets/duix-first120-audio.m4a`. All DUIX video assets stay muted. The final render should be muxed with that master audio after HyperFrames render.

If a long DUIX clip is reused inside a later timeline section, align `data-media-start` to the source offset. The proven example is:

```html
<video id="v-browser-card"
  src="assets/duix-intro-browser-card.mp4"
  muted playsinline
  data-start="2.63"
  data-duration="6.12"
  data-media-start="2.63"></video>
```

Using `data-media-start="0"` here caused mouth movement to come from the wrong part of the lipsync video.

### Captions

Do not hand-time captions after TTS or speed changes. Run ASR on the final master audio and replace the caption block with ASR segment timings. In the verified build, hand-timed captions were nearly 4 seconds late around 16s.

## Validation Commands

Run from the project directory:

```bash
npx --yes hyperframes@0.6.79 lint
npx --yes hyperframes@0.6.79 inspect --at 11,48 --timeout 120000
npx --yes hyperframes@0.6.79 render --fps 30 --quality standard --workers=1 --low-memory-mode --protocol-timeout=900000 --player-ready-timeout=120000 --output render/first120-template.mp4
```

For the DUIX/CosyVoice template, inspect a wider set:

```bash
npx --yes hyperframes@0.6.79 inspect --at 4,16,24,48,70,105,119 --timeout 180000
```

Extract review frames:

```bash
ffmpeg -y -ss 11.00 -i render/first120-template.mp4 -frames:v 1 ../audit-video-slots/split-layout-system/title-11.00s.jpg
ffmpeg -y -ss 48.00 -i render/first120-template.mp4 -frames:v 1 ../audit-video-slots/split-layout-system/split-system-48.00s.jpg
```

Accept only after viewing the frames.
