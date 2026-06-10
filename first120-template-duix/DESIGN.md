## Style Prompt

Replicate the accepted 120-second dark technology tutorial style from the original reference video:

`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/video-template-analysis/source.mp4`

Use a black honeycomb/grid background, warm gold numbers and headings, cyan tool accents, strong left information panels, right-side digital-human presenter rectangles, bottom Chinese subtitles with thick black stroke, and scan/wipe transitions.

For the current digital-human version, use:

- One continuous master audio track: `assets/duix-first120-audio.m4a`.
- Muted DUIX mouth-sync videos as visual layers only.
- ASR-timed subtitles generated from the final master audio.
- Final ffmpeg mux from rendered video + master audio.

Detailed reusable workflow: `docs/duix-cosyvoice-asr-template.md`.

## Motion Rules

- 0.73s: A-roll is covered by a left-to-right dark reveal into the stats card.
- 2.63-2.97s: stats card changes into browser-window presenter proof.
- 10.13s: A-roll/browser proof is covered by a dark mask, then the HyperFrames title glows in.
- 18.9s: dark card swaps using a narrow vertical white scan line.
- Do not use generic crossfades.
- Do not hand-time captions after changing narration. Run ASR on the final master audio and rebuild the caption clips.
- If a long DUIX lipsync asset is reused at a later timeline point, set `data-media-start` to the matching source offset.
- Every video slot must be verified as moving by comparing two frames, not by one screenshot.
