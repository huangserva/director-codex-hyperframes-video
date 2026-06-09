# Storyboard

This is the human source of truth for a new video made with this template.

Do not start from `index.html`. Do not start from random scene edits. Start here,
then derive the script file, scene map, asset manifest, master audio, ASR captions,
DUIX slices, and final render.

## Template Goal

Create a 390.77s Chinese tech/presenter explainer video in the accepted dark
HyperFrames visual system:

- dark honeycomb/HUD background;
- gold primary type and blue secondary accents;
- strong left information panel plus right presenter video for concept scenes;
- screen-demo scenes use a foreground screen recording plus moving circular PIP;
- step scenes use the dark step-card system;
- proof scenes show real result footage;
- final audio is one continuous master track;
- subtitles are generated from ASR on that master track and burned into the render;
- DUIX videos are muted and exist only for visual mouth movement.

## Required Production Order

1. Finalize this `storyboard.md`.
2. Export the full narration to `production/full-script-390-vX.txt`.
3. Generate or accept one continuous master narration audio.
4. Run FunASR on that exact master audio.
5. Build the caption timeline from ASR.
6. Build DUIX slice map from the same master audio.
7. Generate DUIX mouth-sync videos for required presenter/PIP slots.
8. Fill `data/asset-manifest.json`, `data/audio-manifest.json`, and `data/duix-jobs-manifest.json`.
9. Run `npm run generate:preview`.
10. Run `npm run validate:final`.
11. Render only after final validation passes.

## Full Narration

80万人看过的 Codex 加 Remotion 实战，已经帮助很多小伙伴入门。今天我们继续往前走，用 Agent 制作像这样的高级感动画视频。

这一次重点测试 HyperFrames。你现在就可以用 Codex、Claude Code 这种 Agent，制作科技感口播视频。HyperFrames 到底是什么？怎么配合 Codex，用一句话渲染出视频？我用这期视频讲清楚。

简单说，HyperFrames 是一个开源框架，可以用写 HTML 网页的方式来构建视频。HTML、CSS、JavaScript 能实现的视觉效果，理论上都可以被它渲染出来。

这也是它适合 Agent 的原因。因为视频内容本质上是页面结构、样式、动画和时间轴，大模型不用理解复杂剪辑软件，也能一步一步把画面做出来。

下面我们用 Codex 创建第一个 HyperFrames 视频。先不做复杂效果，只测试它能不能一句话出片。直接输入提示词：请创建一个 Codex 安装教程，要求一九二零乘一零八零，包含科技感配色、字幕、动画和完整时间轴。

接着 Agent 开始创作。第一步，确认制作规范。它不是随便生成网页再录屏，而是先确认尺寸、时长、素材、字幕、动画和输出格式。

第二步，联网搜索。因为视频要讲 Codex 安装，Agent 会先读取官方文档，明确当前版本需要展示哪些步骤。

第三步，检查环境。HyperFrames 渲染视频需要 Node、FFmpeg、Chrome 这些依赖。如果本地没有装，Agent 会继续完善环境。

第四步，初始化项目。生成以后，你会看到完整的项目目录。不会编程也没关系，现在你只需要用自然语言描述目标。

第五步，建立视觉风格。Agent 会写下字体、颜色、背景、卡片、动效和字幕规则，让后面的画面统一在同一套系统里。

所以 HyperFrames 的价值，不只是生成视频，而是把视频制作变成可以复用、可以检查、可以反复修改的工程流程。对 Agent 来说，这比传统剪辑软件更容易理解，也更容易稳定复刻。

到目前为止，内容、环境、工程和设计都已经就位。接着 Agent 开始编码，启动 HyperFrames Studio 预览，并把 MP4 视频输出到项目目录。

你看，这就是 Codex 加 HyperFrames 的第一条视频。效果已经能看，但它更像一个 PPT 演示。如果想让口播视频更有高级感，HyperFrames 也可以继续往上做。

我们来到 HyperFrames 官方文档。这里已经总结好制作视频的推荐步骤：拍摄、设计、脚本、分镜、配音、制作和验证。

你会发现，这套流程和传统口播剪辑没有本质区别。区别在于，传统剪辑很多判断在剪辑师脑子里，而 Agent 需要我们把这些判断写成文件。

首先准备好口播视频。它可以是真人口播，也可以是数字人模板。关键是后面要用一条连续主音轨管理声音，人物视频只负责画面和口型。

接着进入设计环境。前面已经说过，HyperFrames 用 HTML、CSS 和 JavaScript 构建视频，所以我们可以像设计网页一样，先做整条视频的视觉风格。

如果你习惯使用 Claude，可以直接让它帮你设计网页原型。如果你觉得成本太高，也可以试试 Open Design、Stitch 这类工具，先生成视觉稿。

这里选择原型设计，然后把提示词投喂进去。如果你有喜欢的参考图，也可以一起放进去，让 Agent 学习画面层次、字体大小、色彩关系和视频栏位置。

然后 Agent 就会开始自动设计页面原型。这个工具本身就是为设计场景打造的，很适合输出 HyperFrames 所需要的这些设计资产。

其中最重要的文件，就是我们上一个案例里提到的 Design.md。Design.md 本质上是一份给 AI Agent 看的设计说明书。

它会告诉 Agent 当前视频应该使用什么字体、什么颜色、什么背景、什么卡片、什么动效，以及每一类场景应该保持怎样的版式。

而 HyperFrames 也会在项目根目录中优先寻找这个文件，把它作为当前视频制作的视觉风格。经过几次迭代调整，我们就能得到一个符合要求的设计原型。

最后，把这些设计资产导入到 HyperFrames 项目根目录。到这一步，画面的风格、组件和素材入口就基本准备好了。

接下来是准备脚本。对于口播视频来说，脚本最好不只是普通文案。它还应该带上清晰的时间轴，让 Agent 知道每一句话出现在第几秒。

这里可以使用 ASR 工具，把口播音频转换成带有时间轴的 SRT 字幕文件。有了字幕文件以后，Agent 就能很清楚地理解这期节目讲了什么，每句话又对应哪个时间点。

这一点非常关键。声音、字幕和口型必须来自同一条主音轨。不能让数字人视频自己带声音，也不能用旧字幕时间轴硬贴到新声音上。

正确流程是：先生成完整主音轨，再用 ASR 生成字幕，再从主音轨切出 DUIX 口型驱动音频，最后让 HyperFrames 只渲染静音画面。

设计资产和文案脚本都准备好以后，我们就可以创建分镜故事版了。经过反复测试，我把能稳定生成分镜视频的经验，整理成了一个专门的 Skill。

它会自动寻找项目根目录下的设计资产和文案脚本，然后生成一个 storyboard.md 文件。

这个文件里会包含视频规格、设计摘要、分镜节奏、画面目标，以及每个镜头需要呈现什么内容。

你可以把它理解成给 HyperFrames 准备的视频制作详细说明书。没有这个文件，Agent 只能临场发挥；有了它，Agent 才能按同一套模板稳定复刻。

所以你在这期内容里看到的所有 HyperFrames 剪辑素材，基本都是用这套流程制作完成的。

先准备设计资产，再准备带有时间轴的口播脚本，然后生成 storyboard.md 文件，最后让 Agent 根据分镜写 HyperFrames 代码，并渲染成视频。

怎么样，是不是很简单？当然真正要做好，关键不是某个工具，而是顺序不能错。先脚本，先声音，先时间轴，再做画面。

只要这个顺序稳定，后面换主题、换数字人、换素材，也能继续复用同一套视频模板。

好了，本期视频的内容就到这里。感兴趣的小伙伴赶紧去玩一下吧。如果这期内容对你有帮助，期待你的一键三连。

智能只是手段，人类才是答案。这里是投哥不请自来，我们下期再见，拜拜。

## Scene Storyboard

The source SRT is used as timing/content reference only. Raw ASR text may contain
errors, so the final spoken text must come from the cleaned narration above and
the final captions must come from ASR on the final master audio.

| Scene | Time | Scene Type | Component | Asset Slot | Visual Intent | Narration Beat |
| --- | --- | --- | --- | --- | --- | --- |
| s001 | 00:00.000-00:00.733 | hook_stat | StatsHero | duix_intro_first10 | Hook A-roll | 80万人看过的 Codex 加 Remotion 实战 |
| s002 | 00:00.733-00:02.633 | hook_stat | StatsHero | duix_intro_first10 | Hook stat build | 已经帮助很多小伙伴入门 |
| s003 | 00:02.633-00:02.967 | hook_stat | StatsHero | duix_intro_browser_card | Browser card punch | 数据卡片进入，强调案例 |
| s004 | 00:02.967-00:10.133 | hook_stat | StatsHero | duix_intro_browser_card | Browser card foreground | 用 Agent 制作高级感动画视频，进入 HyperFrames 主题 |
| s005 | 00:10.133-00:12.820 | title_card | TitleCard | none | HyperFrames title card | 这一次重点测试 HyperFrames |
| s006 | 00:12.820-00:18.900 | concept_split | SplitTextPresenter | duix_course_presenter | Tech presenter intro | Codex、Claude Code 这类 Agent 可以制作科技感口播视频 |
| s007 | 00:18.900-00:26.633 | concept_split | SplitTextPresenter | duix_question_presenter | Question map | 提出问题：HyperFrames 是什么，如何一句话渲染视频 |
| s008 | 00:26.633-00:32.433 | aroll_emphasis | HeroAroll | duix_cta_aroll | A-roll emphasis | 一键三连和频道口播 |
| s009 | 00:32.433-00:38.220 | concept_split | SplitTextPresenter | duix_def_open_presenter | Designed for Agent | HyperFrames 是开源框架，用 HTML 网页方式构建视频 |
| s010 | 00:38.220-00:45.240 | concept_split | SplitTextPresenter | duix_def_stack_presenter | Agent structure/code | HTML、CSS、JavaScript 能实现的效果都能渲染 |
| s011 | 00:45.240-00:52.050 | concept_split | SplitTextPresenter | duix_def_flow_presenter | Web to video | 解释为什么 HyperFrames 天然适合 Agent |
| s012 | 00:52.050-01:08.567 | concept_split | SplitTextPresenter | duix_def_one_pip | One sentence test | 创建第一个 HyperFrames 视频，测试一句话出片 |
| s013 | 01:08.567-01:25.033 | screen_demo_pip | ScreenWithPip | screen_prompt_plus_duix_pip | Prompt input | 输入 Codex 安装教程提示词，Agent 开始创作 |
| s014 | 01:25.033-01:30.500 | step_card | StepCard | none | Step 01 production spec | 第一步：确认制作规范 |
| s015 | 01:30.500-01:37.500 | screen_demo_pip | ScreenWithPip | screen_agent_log_plus_duix_pip | Agent log proof | 不是网页录屏，而是标准视频工程化流程 |
| s016 | 01:37.500-01:42.867 | step_card | StepCard | none | Step 02 web search | 第二步：联网搜索 |
| s017 | 01:42.867-01:49.467 | screen_demo_pip | ScreenWithPip | screen_doc_search_plus_duix_pip | Official docs search | 读取官方文档，明确安装步骤 |
| s018 | 01:49.467-01:58.300 | step_card | StepCard | none | Step 03 environment check | 第三步：环境检查 |
| s019 | 01:58.300-02:05.667 | screen_demo_pip | ScreenWithPip | screen_env_check_plus_duix_pip | Environment check proof | 检查 Node、FFmpeg、Chrome 等依赖 |
| s020 | 02:05.667-02:14.633 | step_card | StepCard | none | Step 04 init project | 第四步：初始化项目 |
| s021 | 02:14.633-02:28.767 | screen_demo_pip | ScreenWithPip | screen_project_tree_plus_duix_pip | Project tree proof | 生成项目目录，用自然语言描述目标 |
| s022 | 02:28.767-02:43.733 | step_card | StepCard | none | Step 05 DESIGN.md | 第五步：建立视觉风格和 Design.md |
| s023 | 02:43.733-03:10.267 | screen_demo_pip | ScreenWithPip | screen_studio_preview_plus_duix_pip | Generated files and studio preview | 编码、启动 Studio 预览、输出 MP4 |
| s024 | 03:10.267-03:18.433 | concept_split | SplitTextPresenter | duix_result_eval_presenter | Result evaluation | 第一条视频能看，但更像 PPT，需要继续提升 |
| s025 | 03:18.433-03:44.667 | screen_demo_pip | ScreenWithPip | screen_official_workflow_plus_duix_pip | Official workflow docs | 官方推荐流程：拍摄、设计、脚本、分镜、配音、制作、验证 |
| s026 | 03:44.667-04:08.267 | screen_demo_pip | ScreenWithPip | screen_design_tool_plus_duix_pip | Design tool input and generation | 使用 Claude Design、Open Design、Stitch 做视觉原型 |
| s027 | 04:08.267-04:28.100 | proof_montage | ProofMontage | proof_design_results_video | Design result fast cuts | 展示设计工具生成的设计资产和 Design.md 概念 |
| s028 | 04:28.100-04:42.767 | screen_demo_pip | ScreenWithPip | screen_import_assets_plus_duix_pip | Import design assets | 导入设计资产，准备风格、组件和素材入口 |
| s029 | 04:42.767-04:47.200 | step_card | StepCard | none | Script and SRT | 准备脚本和带时间轴的字幕 |
| s030 | 04:47.200-05:22.767 | screen_demo_pip | ScreenWithPip | screen_srt_script_plus_duix_pip | SRT and script document | 用 ASR/SRT 让 Agent 理解每句话和时间点 |
| s031 | 05:22.767-05:58.633 | concept_split | SplitTextPresenter | duix_storyboard_presenter | Storyboard.md | 生成 storyboard.md：规格、设计摘要、节奏、画面目标、镜头内容 |
| s032 | 05:58.633-06:10.833 | concept_split | SplitTextPresenter | duix_workflow_recap_presenter | Workflow recap | 设计资产、时间轴脚本、storyboard、代码、渲染的完整流程 |
| s033 | 06:10.833-06:30.770 | summary_cta | SummaryCta | duix_final_cta_aroll | Final CTA | 工具不重要，顺序不能错；结尾 CTA |

## Asset Requirements

All moving slots start as TODO in the reusable template. For a real project:

- `duix_*`: generate via DUIX/HeyGem from the correct master-audio slice.
- `screen_*`: use real moving screen recordings with a muted moving DUIX PIP.
- `proof_*`: use real result/proof footage, never a still image pretending to be video.
- `none`: layout-only scenes; no video asset required.

Every conceptual video slot must move. Before final approval, extract two frames
0.5s apart from each video slot and confirm visible motion.

## Caption And SRT Rule

The SRT from the reference video proves why the script needs timing. But for a
new render, never reuse old SRT timing as final subtitles.

Final captions must be generated by ASR from the final master audio, then burned
into `index.html` as visible `.caption-line` clips.

## DUIX Rule

DUIX videos are visual-only. They must be muted in HyperFrames.

The sound heard in the final MP4 must come from one continuous master narration
track, not from individual DUIX clips.
