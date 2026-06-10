# 2 分钟复刻模板说明

原片路径：`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/video-template-analysis/source.mp4`

当前 DUIX 数字人口播模板：`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/first120-template-duix/index.html`

当前 ASR 字幕同步成片：`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/first120-template-duix/render/first120-template-duix-cosy-master-v2-asr-captions-final.mp4`

成片视觉模板原版：`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/first120-template/index.html`

渲染输出：`/Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/first120-template/render/first120-template.mp4`

数字人、连续主音轨、ASR 字幕对齐的完整流程见：`docs/duix-cosyvoice-asr-template.md`。

以后做同类型数字人口播视频时，优先使用 `first120-template-duix`，不要直接改原始视觉模板。

## 时间结构

| 时间 | 模块 | 需要制作/替换的素材 | 关键动效 |
| --- | --- | --- | --- |
| 0.00-0.73 | 开场 A-roll 闪回 | 口播/录屏开头短镜头 | 暗场底图上快速露出 |
| 0.73-2.97 | 数据卡片 Hook | 大数字、标题、独立封面、右侧双工具框 | 左侧大卡放大进场，中间封面突然放大，右侧框横向延展 |
| 2.63-8.75 | 浏览器/证明页 | 浏览器式画面、主视频卡、红色证明卡 | 整体从左推入，主视频卡二次放大后轻微回落 |
| 8.75-10.13 | A-roll 过渡 | 口播人物画面 | 直接切回真人，承接字幕 |
| 10.13-12.82 | 标题页 | 课程/工具标题，侧边人物切片 | 扫描式横向揭开，标题模糊淡入，底线延展 |
| 12.82-18.90 | 课程结构页 | 3 个工具卡，右侧人物竖框 | 卡片逐个弹入，右侧人物轻微横移 |
| 18.90-26.63 | 问题页 | 问题标题 | 竖向扫描线转场，四角框出现，问题卡淡入 |
| 26.63-32.43 | A-roll 召回 | 一段真人口播视频 | 切入时轻微放大+模糊解除，随后慢速推近 |
| 32.43-68.57 | 定义讲解页 | 左侧说明文案、3 个知识点、右侧人物竖框 | 扫描线切入，文字分层出现，进度线持续拉长，人物慢漂移 |
| 68.57-85.03 | 屏幕操作页 1 | 软件输入/提示词截图，圆形 PIP 人物 | 屏幕从左推入，PIP 弹出，屏幕轻微推近 |
| 85.03-90.50 | Step 01 | 步骤卡文字 | 扫描线切入，步骤面板弹入，3 个子项 stagger 出现 |
| 90.50-97.50 | 屏幕操作页 2 | 执行日志/规范截图，圆形 PIP | 屏幕推入，PIP 弹出，轻微横移 |
| 97.50-102.87 | Step 02 | 步骤卡文字 | 扫描线切入，标题和子项分层进入 |
| 102.87-109.47 | 屏幕操作页 3 | 官方文档/搜索截图，圆形 PIP | 屏幕推入，PIP 弹出，轻微横移 |
| 109.47-118.30 | Step 03 | 环境检查步骤卡 | 面板弹入，3 个依赖项 stagger 出现 |
| 118.30-120.00 | 屏幕操作页 4 | 环境检查截图，圆形 PIP | 快速屏幕推入，收尾 |

## 素材替换位

- `assets/source-first120-audio.m4a`：前 120 秒原声。
- `assets/source-first10-keyed.mp4`：0-10 秒里复用的真人/浏览器短视频。
- `assets/source-aroll-2633-3243.mp4`：26.63-32.43 的真人口播段。
- `assets/source-browser-card-263-875.mp4`：2.63-8.75 浏览器页中间主视频卡，必须是动态视频。
- `assets/source-course-presenter-1282-1890.mp4`：12.82-18.90 右侧竖框口播视频。
- `assets/source-question-presenter-2220-2663.mp4`：22.20-26.63 右侧竖框口播视频。
- `assets/source-def-presenter-3243-5220.mp4`：32.43-52.20 讲解页右侧竖框口播视频。
- `assets/source-def-pip-visible-6286-7157.mp4`：59.86-68.57 出片测试页右下圆形 PIP，素材从原片 62.86 秒开始裁，避免模板视频位先出现空圈。
- `assets/source-circle-pip-6857-12000.mp4`：68.57-120.00 后半段屏幕页圆形 PIP。
- `assets/presenter-title-slice.jpg`：标题页左侧人物切片。
- `assets/screen-codex-prompt.jpg`：68.57 秒屏幕页。
- `assets/screen-agent-log.jpg`：90.50 秒屏幕页。
- `assets/screen-doc-search.jpg`：102.87 秒屏幕页。
- `assets/screen-env-check.jpg`：118.30 秒屏幕页。

## 复刻规则

1. 先按表格准备每段素材，屏幕页统一做成 16:9 截图，人物 PIP 用同一个头像或口播截图保持连续性。
2. 凡是口播框、PIP、浏览器里的视频卡、案例视频卡，必须使用 `<video>` 和 mp4 素材；只有截图、封面、图标、纯 UI 背景才允许用 `<img>`。
3. 数字人版本必须使用一条连续主音轨，DUIX 视频全部静音；最终用 ffmpeg mux 主音轨。
4. 字幕必须来自最终主音轨 ASR 时间戳，不能手工估时。
5. 不要改时间点，先只替换素材和文字；需要变节奏时再改 `data-start` / `data-duration`。
6. 1-4 秒重点保留三件事：左侧数字卡放大进场，中间封面突然放大，右侧工具框延展出来。
7. 32 秒之后的主要节奏是“讲解页长停留 + 屏幕证明 + Step 卡 + 屏幕证明”循环。
8. 每次改完跑 `npx --yes hyperframes@0.6.79 lint && npx --yes hyperframes@0.6.79 inspect`，再渲染。

## 渲染命令

```bash
cd /Users/serva/Documents/Codex/2026-06-05/dance-pop-candidate-genre-pop-recipes/first120-template
npm run render
```
