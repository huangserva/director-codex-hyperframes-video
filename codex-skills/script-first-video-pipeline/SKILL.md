---
name: script-first-video-pipeline
description: Script-first workflow for producing, revising, or rescuing product demo, tutorial, explainer, marketing, or technical videos with TTS, screen recordings, Remotion, HyperFrames, Suno music, and thumbnails. Use when Codex is asked to make or improve a video, fix narration/visual sync, create a hook/title/cover, use TTS before video timing, preserve accepted video parts, or turn a technical concept such as Claude Code workflows, Coze 3.0 local Agent teams, game demos, or multi-agent orchestration into a clear video.
---

# Script-First Video Pipeline

## Core Priority

Treat video production as this ordered pipeline:

1. **Copy first**: viewer promise, hook, title, chapter structure, claims, and exact narration.
2. **TTS second**: generate and validate the voice before locking visual timing.
3. **Video third**: edit, animate, and compose visuals to follow the approved narration.
4. **Music and cover last**: add instrumental music under the voice; make the thumbnail from the strongest promise plus recognizable visual proof.

If the copy is weak, no amount of animation will save the video. If the TTS is broken, no amount of visual polish will make the video feel professional.

For Huang's product videos, do not optimize by guessing. Preserve accepted parts, make small previewable patches, and verify the exact complaint: copy, voice, visual sync, original audio leak, or layout.

## Workflow

### 1. Lock The Message

Before rendering a full video, write or revise the script brief:

- **Audience**: who should click and what problem they have.
- **Promise**: what the video will make clear by the end.
- **Hook**: one strong sentence, not a generic intro.
- **Structure**: 3-6 chapters with a visible progress model if the video is educational.
- **Terminology**: exact pronunciation and spelling for names such as `Claude Code`, `HippoTeam`, product names, models, APIs, and technical terms.
- **Forbidden claims**: avoid unverified numbers, discounts, affiliate links, or campaign terms unless the user explicitly wants them in the video.

Good hook pattern:

```text
一个视频讲清楚 <topic> 的机制，以及如何把它用到 <user's system/outcome>。
```

For technical/product explainers, prefer concrete viewer value:

```text
一个视频讲清楚 Claude Code Workflow 的机制，以及如何把它搬进自己的多 Agent 体系。
```

Avoid vague hooks:

```text
今天给大家介绍一个很强的工具。
```

For Coze 3.0 local-Agent videos, the message must make the product and outcome explicit:

```text
以前 Claude Code、Codex CLI、OpenClaw 经常各跑各的。这个视频用 Coze 3.0 把它们拉进同一个项目，像一个本地 Agent 团队一样协作，最后做出一个能玩的小游戏。
```

If the source files are numbered, respect that order. Do not reorder the script away from the recorded demo path unless the user approves. The game result is not a side note; it is the proof at the end.

### 2. Generate TTS Before Timing

Use narration as the source of truth for duration.

- Generate one continuous TTS per coherent chapter, or one whole-video TTS when the voice engine is stable.
- Avoid many tiny clips unless the visual needs hard scene boundaries.
- Add small leading/trailing silence or padding so the first syllable is not clipped.
- Listen to the TTS alone before putting it into video when the voice, pronunciation, or engine is uncertain.
- If the user reports repeated clicks/stutters at segment joins, regenerate longer continuous chunks instead of trying to hide the problem in the mix.
- Keep a pronunciation list. If text says `Claude Code`, the subtitle and spoken form should match unless the user explicitly wants localized reading.

TTS acceptance checkpoint:

```text
Script approved -> TTS generated -> TTS listened to alone -> only then lock video timing.
```

#### Local CosyVoice Voice Clone Route

When the user wants the local cloned voice, default to CosyVoice under `/Users/serva/CosyVoice` with the conda Python at `/Users/serva/miniconda3/envs/cosyvoice/bin/python`. Do not switch to MiMo/Xiaomi or another remote TTS unless the user explicitly asks.

Critical dependency rule:

```bash
PYTHONPATH=/Users/serva/.hermes/runtime/cosyvoice_tf4513:/Users/serva/CosyVoice/third_party/Matcha-TTS \
  /Users/serva/miniconda3/envs/cosyvoice/bin/python ...
```

Never run CosyVoice3 bare from the conda env for production TTS. The bare env has produced garbled audio because it loads `transformers 5.6.2` / `tokenizers 0.22.2`. The fixed `PYTHONPATH` forces the verified `transformers 4.51.3` / `tokenizers 0.21.4` runtime.

Default generation route:

1. Use an approved prompt audio, preferably 3-5 seconds, mono 24 kHz WAV.
2. Use exact prompt text for that prompt audio, prefixed as `You are a helpful assistant.<|endofprompt|>...`.
3. Generate with CosyVoice3 `inference_zero_shot` through the fixed `PYTHONPATH` runtime.
4. First export a short `.m4a` listening sample. Only generate full narration after the user approves the voice.

For the Coze/HippoTeam video family, the known approved reference is `old-good-hook.m4a`; convert it to a short prompt WAV and use the exact first line text:

```text
You are a helpful assistant.<|endofprompt|>我最近在做一个多 Agent 编排项目
```

Known reference path on the original production Mac, when available:

```text
$APPROVED_PROMPT_AUDIO
```

Use command shape:

```bash
PYTHONPATH=/Users/serva/.hermes/runtime/cosyvoice_tf4513:/Users/serva/CosyVoice/third_party/Matcha-TTS \
  /Users/serva/miniconda3/envs/cosyvoice/bin/python ../claude-workflow-sample/scripts/generate_cosyvoice.py \
  --mode zero_shot \
  --prompt-wav qa/tts/prosody-test/old-good-hook-short-prompt.wav \
  --prompt-text-file qa/tts/prosody-test/old-good-hook-short-prompt-text.txt \
  --text-file qa/tts/prosody-test/coze3-hook-text.txt \
  --output qa/tts/prosody-test/coze3-old-good-fixed-zeroshot.wav \
  --speed 1.0
```

Do not default to `say -> inference_vc`. That route preserves content but makes rhythm mechanical and loses the approved narration style. Use it only as a last-resort intelligibility fallback after telling the user it will not match the previous voice quality.

Pitfalls:

- `prompt_text` must match prompt audio. Guessing or approximating prompt text can produce gibberish.
- Copy the prompt/reference audio into the project cache before use, especially if the original file is in iCloud, Downloads, WeChat temp, or another sync-managed location.
- Convert prompt audio to mono 24 kHz WAV and verify duration/sample rate with `ffprobe` before CosyVoice. Wrong sample rate can sound like the voice is "乱码" even if generation finishes.
- First generate a short `.m4a` listening sample and ask the user to hear it when voice quality is uncertain. Do not hide a questionable voice inside the video mix.
- If CosyVoice warns `too short than prompt text`, stop and shorten the prompt. Do not ignore it.
- Keep prompt audio short. Long prompt text makes short generated chunks fail.
- If output is乱码, first check whether the fixed `PYTHONPATH` was used.
- For speed tuning, bracket with short samples before full generation. If `210` is too fast and `180` is too slow, test `195`, `200`, and `205`.
- If the user approved a voice method yesterday or earlier in the thread, find and reuse that exact method instead of trying MiMo, macOS `say`, or a new voice-conversion route.

#### Remote CosyVoice3 Master Voice API Route

When the user explicitly provides or asks for the remote CosyVoice3 master voice API, treat it as an approved CosyVoice provider, not as MiMo/Xiaomi. Use it for quick shared-GPU production or listening samples, while keeping the same audio-first pipeline.

Required environment variable:

```bash
COSYVOICE3_MASTER_API_BASE_URL=http://host:port
```

API shape:

- `GET /health` returns model status, prompt wav, and CUDA availability.
- `POST /tts` accepts JSON `{ "text": "...", "speed": 1.0 }`.
- The current implementation returns JSON metadata with `download_url`; it does not directly return the WAV body. Fetch `download_url` to obtain the actual 24kHz mono WAV.

Example:

```bash
curl -sS "$COSYVOICE3_MASTER_API_BASE_URL/health"
curl -sS -X POST "$COSYVOICE3_MASTER_API_BASE_URL/tts" \
  -H "Content-Type: application/json" \
  --data '{"text":"黄总你好，这是远程 CosyVoice3 母版音色合成测试。","speed":1.0}' \
  --output meta.json
# Then download meta.json.download_url.
```

For `director-codex-hyperframes-video`, prefer the checked-in helper:

```bash
cd first390-template-locked
COSYVOICE3_MASTER_API_BASE_URL=http://host:port \
  npm run tts:remote-cosyvoice3 -- \
  --text-file production/full-script-390-v4.txt \
  --output production/audio/remote-cosyvoice3-master.wav \
  --speed 1.0
```

Do not commit public API base URLs, tokens, or service credentials to shared repos; keep the base URL in the environment.

#### LAN VoxCPM TTS Route

When the user mentions a LAN VoxCPM TTS service, use this route as a tested alternative only when the user provides the endpoint/token in the current environment. Do not commit private endpoint values or tokens.

```bash
curl "$VOXCPM_TTS_BASE_URL/health"
curl -X POST "$VOXCPM_TTS_BASE_URL/v1/audio/speech" \
  -H "X-TTS-Token: $VOXCPM_TTS_TOKEN" \
  -F 'text=测试文本' \
  -F 'prompt_text=参考音频对应字幕' \
  -F 'prompt_audio=@ref.wav' \
  -F 'reference_audio=@ref.wav' \
  -F 'cfg_value=1.0' \
  -F 'inference_timesteps=16' \
  --output out.wav
```

Verification from this machine: `GET /health` returned `{"ok":true,"sample_rate":48000}` and a generated test WAV returned 48 kHz mono audio with real volume. Prepare reference audio locally first; for the known approved voice, trim/convert `old-good-hook.m4a` to a 48 kHz mono WAV and use prompt text `我最近在做一个多 Agent 编排项目`.

Same-text comparison from this machine: local CosyVoice took 43.74s to produce 9.28s audio; LAN VoxCPM took 58.88s to produce 12.80s audio. VoxCPM can do reference-based cloning through `prompt_audio` and `reference_audio`, but do not assume it is better than the approved CosyVoice route until the user listens to a sample.

### 3. Time Visuals To The Voice

Build the visual schedule from actual TTS duration.

- Scene length follows the voice, not a guessed fixed duration.
- Important UI actions appear exactly when they are mentioned.
- If narration says a concept is “entering Verify stage,” the frame should show Verify or a clear visual equivalent.
- Do not let chapter transitions jump to a new topic without narration bridge.
- If a previous version is 80% accepted, preserve those parts and patch only the weak sections.
- For multi-part demos, show the real screen clip that matches the current sentence. If TTS says `Coze 3.0 带领本地 Agent 团队`, the frame should show Coze/project/agent-team evidence, not an unrelated local page.
- Keep a visible top progress bar for tutorial/explainer videos. It should show the current chapter and prevent abrupt topic jumps.

For review cycles, render the smallest useful unit:

- first chapter sample,
- repaired segment,
- TTS-only sample,
- cover/thumbnail draft,
- then full render.

### 4. Use Real Visual Proof

For technical videos, real screen evidence beats abstract animation.

- Use actual screen recordings, terminal panes, app UI, workflow queues, agent lists, logs, or model routing screens when available.
- Make the relevant screen large enough to inspect.
- Crop to the action target; do not show huge blank browser chrome when the valuable content is small.
- Highlight only the thing being discussed: box, cursor, zoom, callout, or progress marker.
- Do not cover key UI, face, subtitles, input boxes, or proof moments with decorative overlays.
- Animations should explain sequence and causality, not merely decorate.
- Use the accepted page style for polished screen-recording explainers: bright acrylic background, nested rounded video/browser frame, visible top chapter progress bar, bottom progress line, restrained cobalt/emerald/orange accents, and one readable callout. Avoid black-heavy generic HUDs for Coze videos unless the user explicitly asks for that style.
- When replacing a hook recording, keep the approved TTS and page shell. Only swap the embedded video content and update visible labels/badges, such as `Claude Code`, `Codex CLI`, `OpenClaw`, and `COZE 3.0`.

When making a cover or thumbnail, include an immediately recognizable visual:

```text
Bad: abstract neon network with no product clue.
Good: large title + real workflow screen showing multiple agents running + strong high-contrast HUD framing.
```

### 5. Keep Audio Systems Separate

Until final assembly, keep these separate:

1. video-only render,
2. TTS narration,
3. explicitly whitelisted original audio windows,
4. pure instrumental music.

Never use an already-mixed MP4 as the audio source unless preserving that exact mix is the task.

For original audio:

- whitelist exact timeline windows,
- extract from source audio,
- silence everywhere else,
- verify the window after final mix.

For Suno or other music:

- require pure instrumental,
- use negative tags such as `vocals, singing, lyrics, rap, spoken words, choir, vocal chops, voice`,
- mix below TTS with ducking,
- make the music audible enough to feel the rhythm but never mask consonants.

### 6. Thumbnail And Title Rules

The thumbnail is copy-first too.

- One dominant promise, not many small labels.
- Use large readable text.
- Use a real visual proof layer: screen recording, product UI, workflow queue, before/after, or recognizable tool state.
- Match the video’s actual content. Do not overpromise.
- For geek/HUD style: black base, yellow terminal labels, red warning blocks, blue signal accents, and real terminal/app screenshots.
- If the user says a cover is not attractive, revise the copy and proof visual before changing colors.
- For the Coze 3.0 game demo cover, the core promise is: `用 Coze 3.0 带领本地 Agent 团队做游戏`. Include `Claude Code`, `Codex CLI`, and `OpenClaw` as recognizable team members, plus a small game-result visual.

Useful thumbnail structures:

```text
一个视频讲清楚
Claude Code Workflow
机制怎么用？

搬进自己的多 Agent 体系
```

or:

```text
Claude Code Workflow
到底怎么跑？

多 Agent 编排实战
```

### 7. QA Checklist

Before final delivery:

- The hook/title matches what the video actually teaches.
- TTS has no clipped first syllables, repeated stutters, wrong names, or awkward segment joins.
- Visuals reveal what the narration mentions at that moment.
- Real proof clips are large and readable.
- Original audio exists only in whitelisted windows.
- Music is pure instrumental and audible under narration.
- Final cover has both a strong promise and a recognizable proof image.
- Provide local final paths for video, preview clips, TTS samples, music, and cover assets when created.

## Failure Modes To Avoid

- Starting with animation before the script is clear.
- Cutting visuals to arbitrary durations before TTS exists.
- Generating dozens of short TTS clips that clip at every join.
- Hiding weak explanation behind flashy effects.
- Making abstract covers that do not show the real tool or workflow.
- Re-rendering the whole accepted video when only one segment needs repair.
- Claiming numbers or plans that the user did not approve.
