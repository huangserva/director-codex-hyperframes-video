# Component Contracts

These are the only legal building blocks for the 390.77s template. They absorb the
accepted 2-minute DUIX visual system.

Choose the component from `scene_type`, not from convenience:

- `hook_stat` -> `StatsHero`
- `title_card` -> `TitleCard`
- `concept_split` -> `SplitTextPresenter`
- `screen_demo_pip` -> `ScreenWithPip`
- `aroll_emphasis` -> `HeroAroll`
- `step_card` -> `StepCard`
- `proof_montage` -> `ProofMontage`
- `summary_cta` -> `SummaryCta`

## HeroAroll

- Full-bleed moving presenter video.
- Used for direct talking-head emphasis or ending CTA.
- Final audio never comes from this video; the video must be muted if it is DUIX.

## StatsHero

- Accepted 0-10s opening structure.
- Includes statistic impact, card/browser entry, and punch-in motion.
- Must use real moving presenter/card video assets.

## TitleCard

- Unified dark honeycomb background.
- No semi-transparent presenter slice.
- No four-corner viewfinder brackets.

## SplitTextPresenter

- The standard left-information/right-presenter scene.
- Used for concept explanation, question, comparison, key claim, or recap where the
  presenter is part of the main explanation.
- Must use the accepted split variables:
  - `--split-x`
  - `--split-left`
  - `--split-gap`
  - `--split-video`
  - `--split-total`
  - `--split-top`
  - `--split-height`
- Right video must fill the gold frame with no black band.
- Left hierarchy: chip, English kicker, large Chinese headline, subline, HUD cards,
  gold/blue progress line.
- Do not replace the right-side video column with a circular PIP.
- Do not add empty decorative circles or unrelated HUD frames.

## ScreenWithPip

- Foreground screen recording plus a moving PIP video.
- Used only when the screen recording, product operation, website, document, editor,
  terminal, or result page is the main subject.
- The circular PIP is allowed here because it is a helper over a screen demo, not the
  main presenter layout.
- One background layer plus one foreground subject layer.
- No stacked decorative overlays that confuse the focal hierarchy.
- No second empty circle, empty HUD ring, or decorative duplicate PIP.

## StepCard

- Dark instructional card based on the accepted visual system.
- No video required.
- Used as a short structure marker. Do not stretch it into a long explanation scene
  that should be `concept_split`.

## ProofMontage

- Real proof/result videos or screen recordings.
- Fast-cut proof rhythm, not static empty rectangles.

## SummaryCta

- Ending A-roll or split summary.
- Must use a real moving digital-human or presenter video.
