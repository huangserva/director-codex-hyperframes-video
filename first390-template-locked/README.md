# First390 Locked Template

This folder is the new 390.77s template system. It exists to prevent the exact
failure mode where a longer scaffold silently replaces the accepted 2-minute visual
system.

## Source Of Truth

- GitHub archive: https://github.com/huangserva/director-codex-hyperframes-video
- Creative source of truth: `storyboard.md`
- Timing/content reference: local source video, not committed to this template repo.
- Visual/layout source of truth: the locked component contracts and reference JPGs.
- Accepted first 120s review render: keep locally or in a Release, not in Git.
- Accepted split reference: `assets/reference-split-48s.jpg`
- Accepted title-card reference: `assets/reference-title-11s.jpg`

The old full-length scaffold may be used only for timing analysis. It must not be
used as a layout source.

## Locked Workflow

1. Finalize `storyboard.md`, including full narration, scene table, asset needs,
   SRT/caption policy, and DUIX policy.
2. Export the narration from `storyboard.md` into `production/full-script-390-vX.txt`.
3. Generate or accept one continuous master audio file.
4. Run ASR on that exact master audio.
5. Build captions and the DUIX slice map from that same master audio.
6. Burn the ASR-derived captions into the generated HyperFrames HTML as visible
   `.caption-line` clips. Caption JSON alone is not a final subtitle.
7. Update `data/audio-manifest.json`; final mode requires all required audio items.
8. Update `data/duix-jobs-manifest.json`; every DUIX output asset needs a job record.
   Remote GPU submission is documented in `docs/duix-remote-submission.md`.
9. Classify every scene in `data/scene-map-390.json` with `scene_type`.
10. Every `scene_type` must map to the component locked in `template.lock.json`.
11. Every conceptual video slot must be listed in `data/asset-manifest.json`.
12. Missing video assets must stay `todo`; they cannot be disguised as final footage.
13. Run `npm run validate:template` before writing or rendering HTML.
14. Run `npm run generate:preview` to create `index.html` from the locked map.
15. Run HyperFrames `lint` and `inspect`.
16. Before any final render, run `npm run validate:final`. This must fail while TODO
   assets remain.

## Allowed Components

- `HeroAroll`
- `StatsHero`
- `TitleCard`
- `SplitTextPresenter`
- `ScreenWithPip`
- `StepCard`
- `ProofMontage`
- `SummaryCta`

All left-text/right-presenter scenes must use `SplitTextPresenter` with the accepted
split variables from the 2-minute template.

Circular PIP is allowed only for screen-demo scenes where a screen recording is the
main subject. It is not a replacement for the right video column in concept split
scenes. Empty HUD circles and decorative empty frames are forbidden.

## Template State

- Scene map: 33 scenes covering 0-390.77s.
- Audio manifest: required slots are defined, but generated audio assets are
  `todo` in this reusable template repo.
- DUIX jobs manifest: required job contracts are defined, but all jobs are `todo`
  until a real project generates `dub.wav`, submits DUIX, and receives mp4 output.
- Asset manifest: all moving video slots are `todo` placeholders. A project must
  replace each slot with a real moving mp4 before final render.
- `index.html` is generated from the locked scene map. Do not hand-edit it as the
  source of truth.
- Final render must include burned-in `.caption-line` clips; `validate:final`
  fails until the project has real ASR captions and real media assets.
- Accepted output videos belong in local production storage or GitHub Releases,
  not in Git.

## Failed 390s Verification Pass

The following reference is kept only as a failed verification artifact. That pass
skipped the audio-first workflow and exposed layout-rule gaps, so it must not be
treated as accepted template output.

- Contact sheet: `audit/source-vs-verify390-contact.jpg`

That pass used a re-encoded proxy of the source video for the 120-390.77s video
slots. It is useful only as a regression example: render-chain success does not
prove the template is correct unless the audio-first gate and scene-type layout
gates pass.

Known failure:

- No 390s master audio was created first.
- No ASR-derived 390s caption timeline existed.
- No DUIX slice map existed.
- No complete DUIX job manifest existed.
- Some later layouts used the wrong scene treatment, such as circular PIP where a
  concept split should control the layout.
- `validate:final` must fail until these are corrected.

## Commands

```bash
npm run validate:template
npm run generate:preview
npx --yes hyperframes@0.6.79 lint
npx --yes hyperframes@0.6.79 inspect --at 4,16,48,105,160,210,260,310,360,385 --timeout 180000
npm run validate:final
```
