# Codex + HyperFrames + DUIX + LTX Video Template

This is a reusable template repository for the locked Codex + HyperFrames + DUIX
technical video workflow.

It is not a media archive. Large generated assets such as final renders, DUIX
mouth-sync outputs, WAV masters, and prepared job bundles are intentionally kept
out of Git.

Accepted baseline template:

```text
first120-template-duix/
```

Locked extension template:

```text
first390-template-locked/
```

Human-readable project overview:

```text
first390-template-locked/docs/codex-hyperframes-duix-ltx-video-template.html
```

Project-specific Codex skills:

```text
SKILLS.md
codex-skills/
```

Install them on a fresh machine with:

```bash
node scripts/install-codex-skills.mjs
```

DUIX remote GPU submission notes:

```text
first390-template-locked/docs/duix-remote-submission.md
```

Creative source of truth:

```text
first390-template-locked/storyboard.md
```

Core rule: storyboard first, then audio first. The final render must use one
continuous master audio, FunASR-derived burned-in captions, muted DUIX video
layers, and the locked scene components validated by `npm run validate:final`.

This repository includes the accepted first 120s template media required to
reproduce the layout source of truth. It still excludes generated renders,
prepared job bundles, WAV masters, and final DUIX production outputs.

Expected validation behavior:

- `npm run validate:template`: passes with TODO warnings in a fresh template.
- `npm run validate:final`: fails until a real project supplies master audio,
  FunASR captions, DUIX outputs, and all required moving video slots.

The validation also fails if `first120-template-duix/index.html` or its key
template media assets are missing. Without that baseline, this repository is not
a reproducible template project.
