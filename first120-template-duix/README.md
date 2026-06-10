# first120-template-duix

这是当前可复用的 120s HyperFrames + DUIX 数字人口播模板。

## 关键入口

- 原始视觉参考片：`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/video-template-analysis/source.mp4`
- 当前模板工程：`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/first120-template-duix`
- 当前验证成片：`render/first120-template-duix-cosy-master-v2-asr-captions-final.mp4`
- 完整复用流程：`docs/duix-cosyvoice-asr-template.md`
- 原 2 分钟结构表：`docs/two-minute-replication-template.md`

## 不可破坏的规则

- 只用一条连续主音轨：`assets/duix-first120-audio.m4a`。
- DUIX 数字人视频全部静音，只负责口型和画面。
- DUIX 驱动音频切片来自最终主音轨，并转为 verified 格式，通常是 44.1kHz mono WAV。
- 字幕必须从最终主音轨 ASR 时间戳生成，不能手工估时。
- ASR 替换字幕后必须确认没有旧字幕 clip 残留。
- 左右分栏使用已接受的强排版，不要改成弱信息栏。
- 所有视频槽必须用 `<video>`，并用两帧验证确实在动。
- 长 DUIX 素材复用到后面时间点时，检查 `data-media-start`。
- 新实验不要覆盖已验收成片，先复制工程或使用新输出文件名。

## 标准 QA

```bash
npx --yes hyperframes@0.6.79 lint
npx --yes hyperframes@0.6.79 inspect --at 4,16,24,48,70,105,119 --timeout 180000
```

最终渲染后必须用 ffmpeg mux `assets/duix-first120-audio.m4a`，并校验最终音频 hash 和主音轨一致。
