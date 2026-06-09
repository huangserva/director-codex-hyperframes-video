# Codex + HyperFrames + DUIX + LTX Video Template

This is a reusable template repository for the locked Codex + HyperFrames + DUIX
technical video workflow.

It is not a media archive. Large generated assets such as final renders, DUIX
mouth-sync outputs, WAV masters, and prepared job bundles are intentionally kept
out of Git.

Main project:

```text
first390-template-locked/
```

Human-readable project overview:

```text
first390-template-locked/docs/codex-hyperframes-duix-ltx-video-template.html
```

Creative source of truth:

```text
first390-template-locked/storyboard.md
```

Core rule: storyboard first, then audio first. The final render must use one
continuous master audio, FunASR-derived burned-in captions, muted DUIX video
layers, and the locked scene components validated by `npm run validate:final`.

Large outputs belong in local production storage or GitHub Releases, not in this
template repository.

Expected validation behavior:

- `npm run validate:template`: passes with TODO warnings in a fresh template.
- `npm run validate:final`: fails until a real project supplies master audio,
  FunASR captions, DUIX outputs, and all required moving video slots.
