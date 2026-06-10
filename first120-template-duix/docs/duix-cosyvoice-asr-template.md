# DUIX 数字人口播模板复用说明

这份文档记录当前 120s 模板的标准生产方式。以后做同类型“黑色科技感 + 左侧信息栏 + 右侧数字人口播 + 屏幕证明/PIP”的视频，优先按这里执行。

## 文件定位

- 原始视觉参考片：`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/video-template-analysis/source.mp4`
- 当前可复用模板工程：`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/first120-template-duix`
- 数字人底片：`/Users/serva/Desktop/template3_talk_locked_camera_duix_lipsync.mp4`
- 当前通过 ASR 字幕对齐后的成片：`render/first120-template-duix-cosy-master-v2-asr-captions-final.mp4`

注意：`source.mp4` 是视觉动效参考片；数字人底片只是 DUIX 口型载体。不要混用概念。

## 核心做法

最终视频只能有一条连续主音轨。

正确结构：

- `assets/duix-first120-audio.m4a`：全片连续旁白主音轨。
- `assets/duix-*.mp4`：DUIX 生成的人物口型视频，只作为静音画面层。
- `index.html`：HyperFrames 画面、动效、字幕时间轴。
- 最终 MP4：HyperFrames 渲染视频 + `duix-first120-audio.m4a` 重新 mux。

不要让每个 DUIX 视频片段自己带声音，否则没有数字人画面的地方会没声音，数字人出现/消失时也会有断裂。

## 标准流程

1. 复制当前模板工程到新目录，或者至少使用新的 render 输出文件名；不要覆盖已验收版本。
2. 先确定 120s 台词。
3. 用已批准的 CosyVoice 路线生成一条完整主音频。当前批准路线包括远程 CosyVoice3 母版音色 API，以及本地 CosyVoice3 zero-shot fallback。
4. 如果需要压缩到 120s，先完成压缩，再把压缩后的音频作为唯一主音轨。
5. 按数字人出现的时间点，从主音轨里切片。
6. 将 DUIX 驱动音频切片转换成 verified 格式，通常是 `44.1kHz mono WAV`。
7. 用这些音频切片跑 DUIX/HeyGem，得到对应的 `duix-*.mp4` 口型视频。
8. 在模板里替换 DUIX 视频素材，所有数字人视频保持 `muted playsinline`。
9. 用最终主音轨跑 ASR，按 ASR 的真实时间戳重建字幕轨。
10. 确认旧字幕 clip 没有残留，字幕轨只保留一套当前 ASR 字幕。
11. 渲染 HyperFrames 视频。
12. 用 ffmpeg 把连续主音轨 mux 到最终 MP4。
13. 做 QA：字幕、口型、音频连续性、视频是否在动、布局是否歪。

## CosyVoice TTS 路线

### 远程 CosyVoice3 母版音色 API

这是当前推荐的共享母版音色路线。代码不要写死公网地址，使用环境变量：

```bash
COSYVOICE3_MASTER_API_BASE_URL=http://host:port
```

调用规则：

- `GET /health`：检查服务、模型、CUDA 和母版 prompt wav。
- `POST /tts`：提交 JSON，字段为 `text` 和 `speed`。
- 注意：`POST /tts` 返回 JSON 元数据，不是直接返回 WAV。必须读取其中的 `download_url`，再 `GET /download/{filename}` 下载实际 WAV。
- 输出应为 24kHz 单声道 WAV。

项目 helper：

```bash
cd first390-template-locked
COSYVOICE3_MASTER_API_BASE_URL=http://host:port \
  npm run tts:remote-cosyvoice3 -- \
  --text-file production/full-script-390-v4.txt \
  --output production/audio/remote-cosyvoice3-master.wav \
  --speed 1.0
```

### 本地 CosyVoice3 fallback

本地路线仍可用，但必须使用已验证 runtime：

```bash
PYTHONPATH=/Users/serva/.hermes/runtime/cosyvoice_tf4513:/Users/serva/CosyVoice/third_party/Matcha-TTS \
  /Users/serva/miniconda3/envs/cosyvoice/bin/python ...
```

不要裸跑 conda env，也不要默认切到 MiMo/Xiaomi。

## 当前视频槽位

| 时间 | 场景 | 资产 |
| --- | --- | --- |
| 0.00-10.33 | 开场/浏览器证明 | `duix-intro-first10.mp4`、`duix-intro-browser-card.mp4` |
| 12.82-18.90 | 左右分栏课程页 | `duix-course-presenter.mp4` |
| 22.20-26.63 | 问题页右侧人物 | `duix-question-presenter.mp4` |
| 26.63-32.43 | A-roll 全屏人物 | `duix-cta-aroll.mp4` |
| 32.43-38.10 | 定义页 1 | `duix-def-open-presenter.mp4` |
| 38.22-45.10 | 定义页 2 | `duix-def-stack-presenter.mp4` |
| 45.24-52.05 | 定义页 3 | `duix-def-flow-presenter.mp4` |
| 59.86-68.57 | 出片测试页 PIP | `duix-def-one-pip.mp4` |
| 68.57-85.03 | 提示词屏幕页 PIP | `duix-prompt-pip.mp4` |
| 90.50-97.50 | Agent 日志页 PIP | `duix-agent-log-pip.mp4` |
| 102.87-109.47 | 文档搜索页 PIP | `duix-doc-search-pip.mp4` |
| 118.30-120.00 | 环境检查页 PIP | `duix-env-check-pip.mp4` |

## 关键坑

### 1. 字幕不同步

原因：字幕时间是手工估算的，不是最终音频识别出来的。

修法：对最终 `assets/duix-first120-audio.m4a` 跑 ASR，重建字幕轨。不要手动一点点挪。

这次实测问题：旧字幕把“HyperFrames 到底是什么”放在 `18.48s`，ASR 识别真实时间是 `14.76s-16.08s`，差了接近 4 秒。

### 2. 口型不对

优先检查 `data-media-start`。如果一个长 DUIX 视频在成片 2.63s 才出现，就不能从素材 0s 开始播。

正确例子：

```html
<video id="v-browser-card"
  src="assets/duix-intro-browser-card.mp4"
  muted playsinline
  data-start="2.63"
  data-duration="6.12"
  data-media-start="2.63"></video>
```

### 3. 声音不连续

原因：声音来自 DUIX 视频片段。

修法：最终只 mux 一条 `assets/duix-first120-audio.m4a` 主音轨，DUIX 视频全静音。

### 4. 视频槽变静帧

凡是人物框、浏览器中间视频卡、PIP，只要视觉上是视频，就必须放 `<video>`，不能放截图。用两帧 md5 验证是否在动。

### 5. 左右分栏变弱

所有左右分栏都使用已接受的强排版：

- 左侧大信息面板占主导。
- 小 chip + 英文 kicker + 大中文标题 + 说明行 + HUD 卡片 + 金蓝进度线。
- 右侧人物竖框和左侧同一套高度系统。
- 禁止随意缩小右侧视频或让左右高度错位。

### 6. 误改已验收版本

每次新实验都要新建目录或新输出文件名。当前已验收参考是：

`render/first120-template-duix-cosy-master-v2-asr-captions-final.mp4`

不要直接覆盖它。

### 7. 原片和数字人底片混淆

- `source.mp4`：学习动效、布局、节奏的视觉参考。
- `template3_talk_locked_camera_duix_lipsync.mp4`：DUIX 口型载体。

复刻视觉时看 `source.mp4`，生成口型时用数字人底片。

### 8. 把敏感连接信息写进模板

这个模板文档只记录流程，不记录 SSH 密码、token、cookie、私有接口凭证。DUIX/HeyGem 具体提交和轮询细节使用 `duix-heygem-lipsync` skill。

### 9. 画面层级变乱

8 秒附近这类浏览器/证明页只允许一个背景层 + 一个前景视觉主体 + 必要 HUD。不要叠多层半透明窗口、红框、视频切片，否则视觉会乱。

### 10. 标题页背景不统一

10-12 秒标题页必须使用统一黑色蜂窝背景，不要再放半透明人物切片当背景。

## ASR 字幕命令

```bash
cd /Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/first120-template-duix
mkdir -p audit-cosy-master-v2/asr-sync
mlx_whisper assets/duix-first120-audio.m4a \
  --model mlx-community/whisper-large-v3-turbo \
  --language zh \
  --task transcribe \
  --word-timestamps True \
  --output-format json \
  --output-dir audit-cosy-master-v2/asr-sync \
  --output-name duix-first120-large-v3-turbo \
  --verbose False
```

只允许做术语文字修正，例如：

- `Cloud Code` -> `Claude Code`
- `Hyperframes` -> `HyperFrames`
- `FFMPAP` -> `FFmpeg`

不要随意改 ASR 时间戳。

## 渲染和封装

```bash
cd /Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/first120-template-duix
npx --yes hyperframes@0.6.79 lint
npx --yes hyperframes@0.6.79 inspect --at 4,16,24,48,70,105,119 --timeout 180000
npx --yes hyperframes@0.6.79 render \
  --fps 30 \
  --quality standard \
  --workers=1 \
  --low-memory-mode \
  --protocol-timeout=900000 \
  --player-ready-timeout=120000 \
  --output render/<render-name>.mp4
ffmpeg -y -hide_banner -loglevel error \
  -i render/<render-name>.mp4 \
  -i assets/duix-first120-audio.m4a \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a copy -shortest \
  render/<final-name>.mp4
```

## 最终 QA

必须检查：

- 没有覆盖已验收成片，最终输出使用新文件名。
- `lint` 为 0 error。
- `inspect` 为 0 layout issues。
- `ffprobe` 最终视频约 120s。
- 最终音频 PCM md5 等于 `assets/duix-first120-audio.m4a` 的 PCM md5。
- 字幕轨没有旧字幕残留，同一时间不能出现两套 caption。
- 4s、16s、18s、24s、48s、70s、105s、119s 抽帧检查。
- 每个视频槽两帧 md5 不同，证明不是静帧。
- 16s 附近字幕必须与 ASR 时间一致；不要回到旧的手工时间。
- 2.63-8.75s 如果复用长 DUIX 视频，必须检查 `data-media-start`。
- 全片所有 DUIX 视频必须 `muted playsinline`。

完整交付前清单：

| 类别 | 必须满足 |
| --- | --- |
| 文件边界 | 不覆盖旧版；新实验有新目录或新文件名 |
| 原片来源 | 视觉参考明确指向 `source.mp4` |
| 数字人来源 | 口型底片明确指向 `template3_talk_locked_camera_duix_lipsync.mp4` |
| 音频 | 一条连续主音轨，最终 mux 进 MP4 |
| DUIX | 所有驱动音频切片来自最终主音轨 |
| DUIX 格式 | 驱动音频为 44.1kHz mono WAV |
| 视频层 | DUIX 视频静音，只做画面 |
| 字幕 | ASR 来自最终主音轨，不手工估时 |
| 字幕清理 | 替换字幕后无旧字幕残留 |
| 口型 | 复用长素材时检查 `data-media-start` |
| 动效 | 1-4s、8s、12-18s、48s 等关键段保留原片节奏 |
| 分栏 | 所有左右分栏使用强排版和统一高度 |
| QA | lint、inspect、ffprobe、md5、抽帧、视频槽运动检查全部通过 |

视频槽运动检查例子：

```bash
FINAL="render/<final-name>.mp4"
ffmpeg -hide_banner -loglevel error -ss 16.0 -i "$FINAL" -vf "crop=430:720:1390:160" -frames:v 1 -f rawvideo - | md5
ffmpeg -hide_banner -loglevel error -ss 16.5 -i "$FINAL" -vf "crop=430:720:1390:160" -frames:v 1 -f rawvideo - | md5
```

两个 hash 应该不同。
