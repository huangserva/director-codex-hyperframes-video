import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const verifyTail = process.argv.includes("--verify-tail");
const tailFinal = process.argv.includes("--tail-final");
const renderStart = verifyTail || tailFinal ? 120 : 0;
const lock = JSON.parse(fs.readFileSync(path.join(root, "template.lock.json"), "utf8"));
const sceneMap = JSON.parse(fs.readFileSync(path.join(root, "data/scene-map-390.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/asset-manifest.json"), "utf8"));
const audioManifest = JSON.parse(fs.readFileSync(path.join(root, "data/audio-manifest.json"), "utf8"));
const captionPath = audioManifest.items?.caption_timeline?.path;
const captionPayload = captionPath && fs.existsSync(path.join(root, captionPath))
  ? JSON.parse(fs.readFileSync(path.join(root, captionPath), "utf8"))
  : { captions: [] };

const scenes = sceneMap.scenes
  .filter((scene) => scene.end > renderStart)
  .map((scene) => {
    const originalStart = Math.max(scene.start, renderStart);
    const originalEnd = scene.end;
    return {
      ...scene,
      originalStart,
      originalEnd,
      start: originalStart - renderStart,
      end: originalEnd - renderStart
    };
  });
const assets = manifest.assets;
const mediaLayers = [];
const captions = (captionPayload.captions || [])
  .filter((caption) => caption.end > renderStart && caption.start < lock.duration)
  .map((caption, index) => ({
    ...caption,
    id: `caption-${index}`,
    start: Math.max(0, caption.start - renderStart),
    end: Math.min(lock.duration - renderStart, caption.end - renderStart)
  }))
  .filter((caption) => caption.end > caption.start && caption.text?.trim());

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const sceneTypeLabels = {
  hook_stat: "上期节目",
  title_card: "章节引入",
  concept_split: "概念解释",
  screen_demo_pip: "屏幕演示",
  aroll_emphasis: "口播强调",
  step_card: "步骤节点",
  proof_montage: "结果证明",
  summary_cta: "总结行动"
};

function sceneLabel(scene) {
  return sceneTypeLabels[scene.scene_type] || scene.scene_type || scene.component;
}

function todoTag(scene, className) {
  return `<div class="todo-slot ${className}"><div>TODO VIDEO ASSET</div><small>${esc(scene.asset_slot)}</small></div>`;
}

function mediaTag(scene, mediaClass) {
  const verifyProxyPath = mediaClass === "media-screen"
    ? "assets/source-tail120-proxy-screen.mp4"
    : mediaClass === "media-pip"
      ? "assets/source-tail120-proxy-pip.mp4"
      : "assets/source-tail120-proxy-main.mp4";
  const asset = verifyTail
    ? { type: "source_proxy_video", path: verifyProxyPath, status: "exists", muted: true }
    : assets[scene.asset_slot];
  if (!asset || asset.status !== "exists") {
    return todoTag(scene, mediaClass.replace("media-", ""));
  }

  const classTrackOffset = mediaClass === "media-screen" ? 100 : mediaClass === "media-pip" ? 200 : mediaClass === "media-proof" ? 300 : 0;
  const track = 20 + Number(scene.id.replace("s", "")) + classTrackOffset;
  const mediaStart = verifyTail ? scene.start : 0;
  mediaLayers.push(`<video id="${scene.id}-${mediaClass}" class="clip media-layer ${mediaClass}" src="${esc(asset.path)}" muted playsinline data-start="${scene.start.toFixed(3)}" data-duration="${(scene.end - scene.start).toFixed(3)}" data-media-start="${mediaStart.toFixed(3)}" data-track-index="${track}" data-layout-allow-overflow></video>`);
  return "";
}

function screenMainTag(scene) {
  if (verifyTail || tailFinal) {
    const track = 420 + Number(scene.id.replace("s", ""));
    mediaLayers.push(`<video id="${scene.id}-media-screen" class="clip media-layer media-screen" src="assets/source-tail120-proxy-screen.mp4" muted playsinline data-start="${scene.start.toFixed(3)}" data-duration="${(scene.end - scene.start).toFixed(3)}" data-media-start="${scene.start.toFixed(3)}" data-track-index="${track}" data-layout-allow-overflow></video>`);
    return "";
  }
  return todoTag(scene, "screen-video");
}

function hudCards(scene) {
  return `
    <div class="hud-cards">
      <div class="hud-card"><span>AI</span><strong>${esc(scene.title)}</strong></div>
      <div class="hud-card"><span>&lt;&gt;</span><strong>直接改代码</strong></div>
    </div>`;
}

function splitScene(scene) {
  return `
    <section id="${scene.id}" class="clip scene component-split" data-component="${scene.component}" data-scene-type="${scene.scene_type}" data-start="${scene.start}" data-duration="${scene.end - scene.start}" data-track-index="10">
      <div class="chip">${esc(sceneLabel(scene))}</div>
      <div class="split-panel">
        <div class="kicker">DESIGNED FOR</div>
        <h1>${esc(scene.title)}</h1>
        <p>沿用 2 分钟模版的强左信息栏和右侧视频栏。</p>
        ${hudCards(scene)}
        <div class="progress-line"><i></i><b></b></div>
      </div>
      <div class="split-video-frame">${mediaTag(scene, "media-split")}</div>
    </section>`;
}

function screenScene(scene) {
  return `
    <section id="${scene.id}" class="clip scene component-screen" data-component="${scene.component}" data-scene-type="${scene.scene_type}" data-start="${scene.start}" data-duration="${scene.end - scene.start}" data-track-index="10">
      <div class="screen-stage">
        ${screenMainTag(scene)}
        <div class="screen-label">${esc(scene.title)}</div>
      </div>
      ${mediaTag(scene, "media-pip")}
    </section>`;
}

function stepScene(scene) {
  return `
    <section id="${scene.id}" class="clip scene component-step" data-component="${scene.component}" data-scene-type="${scene.scene_type}" data-start="${scene.start}" data-duration="${scene.end - scene.start}" data-track-index="10">
      <div class="chip">${esc(sceneLabel(scene))}</div>
      <div class="step-card">
        <span>READY TO RENDER</span>
        <h1>${esc(scene.title)}</h1>
        <p>该段只使用 2 分钟模板里的暗色步骤卡系统。</p>
      </div>
    </section>`;
}

function titleScene(scene) {
  return `
    <section id="${scene.id}" class="clip scene component-title" data-component="${scene.component}" data-scene-type="${scene.scene_type}" data-start="${scene.start}" data-duration="${scene.end - scene.start}" data-track-index="10">
      <div class="title-card">
        <span>口播剪辑工具</span>
        <h1>HyperFrames</h1>
        <p>${esc(scene.title)}</p>
      </div>
    </section>`;
}

function heroScene(scene) {
  return `
    <section id="${scene.id}" class="clip scene component-hero" data-component="${scene.component}" data-scene-type="${scene.scene_type}" data-start="${scene.start}" data-duration="${scene.end - scene.start}" data-track-index="10">
      ${mediaTag(scene, "media-hero")}
      <div class="hero-overlay"><strong>${esc(scene.title)}</strong></div>
    </section>`;
}

function statsScene(scene) {
  return `
    <section id="${scene.id}" class="clip scene component-stats" data-component="${scene.component}" data-scene-type="${scene.scene_type}" data-start="${scene.start}" data-duration="${scene.end - scene.start}" data-track-index="10">
      ${mediaTag(scene, "media-hero")}
      <div class="stat-shell">
        <span>87万人看过</span>
        <strong>87</strong>
        <em>万</em>
      </div>
    </section>`;
}

function proofScene(scene) {
  return `
    <section id="${scene.id}" class="clip scene component-proof" data-component="${scene.component}" data-scene-type="${scene.scene_type}" data-start="${scene.start}" data-duration="${scene.end - scene.start}" data-track-index="10">
      <div class="chip">${esc(sceneLabel(scene))}</div>
      <h1>${esc(scene.title)}</h1>
      <div class="proof-stage">${mediaTag(scene, "media-proof")}</div>
    </section>`;
}

function renderScene(scene) {
  if (scene.component === "StatsHero") return statsScene(scene);
  if (scene.component === "HeroAroll" || scene.component === "SummaryCta") return heroScene(scene);
  if (scene.component === "TitleCard") return titleScene(scene);
  if (scene.component === "SplitTextPresenter") return splitScene(scene);
  if (scene.component === "ScreenWithPip") return screenScene(scene);
  if (scene.component === "StepCard") return stepScene(scene);
  if (scene.component === "ProofMontage") return proofScene(scene);
  throw new Error(`Unhandled component: ${scene.component}`);
}

function captionLayer(caption, index) {
  return `<div id="${caption.id}" class="clip caption-line" data-start="${caption.start.toFixed(3)}" data-duration="${(caption.end - caption.start).toFixed(3)}" data-track-index="${900 + index}">${esc(caption.text)}</div>`;
}

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #030405; color: #f7f2df; font-family: Arial, sans-serif; }
      #root {
        position: relative;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        background: #030405;
        --split-x: 120px;
        --split-left: 1190px;
        --split-gap: 60px;
        --split-video: 430px;
        --split-total: 1680px;
        --split-top: 126px;
        --split-height: 690px;
        --split-left-pad-x: 74px;
        --split-card-y: 442px;
      }
      .clip { position: absolute; }
      .scene {
        inset: 0;
        overflow: hidden;
        background:
          radial-gradient(circle at 44% 48%, rgba(217,177,91,.18), transparent 22%),
          radial-gradient(circle at 79% 56%, rgba(21,151,202,.14), transparent 18%),
          #030405;
      }
      .scene::before {
        content: "";
        position: absolute;
        inset: -80px;
        opacity: .22;
        background-image:
          linear-gradient(30deg, rgba(255,255,255,.13) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,.13) 87.5%, rgba(255,255,255,.13)),
          linear-gradient(150deg, rgba(255,255,255,.13) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,.13) 87.5%, rgba(255,255,255,.13));
        background-size: 118px 204px;
      }
      .scene::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(90deg, rgba(0,0,0,.72), transparent 22%, transparent 78%, rgba(0,0,0,.7)),
          linear-gradient(180deg, rgba(0,0,0,.24), transparent 22%, transparent 72%, rgba(0,0,0,.52));
      }
      video { display: block; object-fit: cover; }
      .chip {
        position: absolute;
        left: var(--split-x);
        top: 78px;
        z-index: 4;
        padding: 10px 24px;
        border: 1px solid rgba(217,177,91,.56);
        border-radius: 999px;
        color: #f4cf75;
        font-size: 25px;
        font-weight: 900;
        background: rgba(217,177,91,.08);
      }
      .split-panel {
        position: absolute;
        z-index: 3;
        left: var(--split-x);
        top: var(--split-top);
        width: var(--split-left);
        height: var(--split-height);
        padding: 134px var(--split-left-pad-x) 70px;
        border: 1px solid rgba(217,177,91,.42);
        border-radius: 16px;
        background: rgba(6, 10, 11, .76);
        box-shadow: 0 0 34px rgba(217,177,91,.16), inset 0 0 90px rgba(21,151,202,.05);
      }
      .kicker, .title-card span, .step-card span {
        color: #f2c45d;
        font-size: 36px;
        font-style: italic;
        font-weight: 950;
      }
      .split-panel h1 {
        margin-top: 28px;
        color: #fff8e6;
        font-size: 78px;
        font-style: italic;
        font-weight: 950;
        line-height: 1.08;
      }
      .split-panel p {
        margin-top: 28px;
        color: #ecebe1;
        font-size: 36px;
        font-style: italic;
        font-weight: 850;
      }
      .hud-cards {
        position: absolute;
        left: var(--split-left-pad-x);
        right: var(--split-left-pad-x);
        top: var(--split-card-y);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      .hud-card {
        height: 120px;
        display: flex;
        align-items: center;
        gap: 30px;
        padding: 0 36px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 10px;
        background: rgba(7, 9, 10, .54);
      }
      .hud-card span { color: #18a9ef; font-size: 30px; font-weight: 950; }
      .hud-card strong { color: #f7f2df; font-size: 32px; font-weight: 900; }
      .progress-line {
        position: absolute;
        left: var(--split-left-pad-x);
        right: var(--split-left-pad-x);
        bottom: 66px;
        height: 4px;
        display: flex;
      }
      .progress-line i { width: 46%; background: #f0c45d; }
      .progress-line b { flex: 1; background: #18a9ef; }
      .split-video-frame {
        position: absolute;
        z-index: 4;
        left: calc(var(--split-x) + var(--split-left) + var(--split-gap));
        top: var(--split-top);
        width: var(--split-video);
        height: var(--split-height);
        border: 4px solid rgba(217,177,91,.9);
        border-radius: 14px;
        overflow: hidden;
        background: #080a0b;
        box-shadow: 0 0 36px rgba(217,177,91,.34);
      }
      .media-layer { position: absolute; object-fit: cover; z-index: 4; }
      .media-hero { inset: 0; width: 100%; height: 100%; z-index: 2; }
      .media-split {
        left: calc(var(--split-x) + var(--split-left) + var(--split-gap));
        top: var(--split-top);
        width: var(--split-video);
        height: var(--split-height);
        border-radius: 12px;
      }
      .media-screen {
        left: 120px;
        top: 112px;
        width: 1420px;
        height: 800px;
        border-radius: 14px;
      }
      .media-pip {
        right: 72px;
        bottom: 66px;
        width: 300px;
        height: 300px;
        border: 5px solid rgba(217,177,91,.96);
        border-radius: 50%;
        box-shadow: 0 0 34px rgba(217,177,91,.42);
      }
      .media-proof {
        left: 190px;
        top: 240px;
        width: 1540px;
        height: 650px;
        border-radius: 14px;
      }
      .screen-video, .pip-video, .proof-video, .split-video, .hero-video { width: 100%; height: 100%; }
      .hero-overlay {
        position: absolute;
        z-index: 4;
        left: 120px;
        bottom: 130px;
        color: #fff8e6;
        font-size: 58px;
        font-style: italic;
        font-weight: 950;
        text-shadow: 0 5px 18px rgba(0,0,0,.72);
      }
      .title-card, .step-card {
        position: absolute;
        z-index: 3;
        left: 370px;
        top: 280px;
        width: 980px;
      }
      .title-card h1, .step-card h1, .component-proof h1 {
        margin-top: 22px;
        color: #f2c45d;
        font-size: 78px;
        font-style: italic;
        font-weight: 950;
        text-shadow: 0 0 26px rgba(217,177,91,.42);
      }
      .title-card p, .step-card p { margin-top: 22px; color: #f7f2df; font-size: 28px; font-weight: 800; }
      .screen-stage {
        position: absolute;
        z-index: 3;
        left: 120px;
        top: 112px;
        width: 1420px;
        height: 800px;
        border: 2px solid rgba(255,255,255,.68);
        border-radius: 16px;
        overflow: hidden;
        background: rgba(248,248,246,.96);
        box-shadow: 0 20px 70px rgba(0,0,0,.36);
      }
      .screen-label {
        position: absolute;
        left: 34px;
        top: 28px;
        padding: 8px 14px;
        color: #111;
        background: rgba(255,255,255,.72);
        border-radius: 6px;
        font-size: 26px;
        font-weight: 900;
      }
      .pip-frame {
        position: absolute;
        z-index: 5;
        right: 72px;
        bottom: 66px;
        width: 300px;
        height: 300px;
        border: 5px solid rgba(217,177,91,.96);
        border-radius: 50%;
        overflow: hidden;
        background: #080a0b;
        box-shadow: 0 0 34px rgba(217,177,91,.42);
      }
      .stat-shell {
        position: absolute;
        z-index: 4;
        left: 118px;
        top: 220px;
        width: 1190px;
        height: 646px;
        border: 2px solid rgba(217,177,91,.30);
        border-radius: 18px;
        background: rgba(8,10,11,.72);
      }
      .stat-shell span { position: absolute; left: 72px; top: 82px; color: #f2c45d; font-size: 58px; font-weight: 900; }
      .stat-shell strong { position: absolute; left: 72px; top: 178px; color: #f5c766; font-size: 250px; font-style: italic; line-height: .95; }
      .stat-shell em { position: absolute; left: 505px; top: 332px; color: #f7f1d6; font-size: 82px; font-style: normal; font-weight: 950; }
      .proof-stage {
        position: absolute;
        z-index: 3;
        left: 190px;
        top: 240px;
        width: 1540px;
        height: 650px;
        border: 1px solid rgba(217,177,91,.36);
        border-radius: 16px;
        overflow: hidden;
        background: rgba(6,10,11,.78);
      }
      .component-proof h1 { position: absolute; z-index: 4; left: 190px; top: 140px; color: #fff8e6; font-size: 54px; }
      .todo-slot {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        text-align: center;
        color: #f0c45d;
        background:
          linear-gradient(135deg, rgba(217,177,91,.12), rgba(21,151,202,.08)),
          rgba(8,10,11,.92);
      }
      .todo-slot div { max-width: 88%; font-size: 24px; font-weight: 950; overflow-wrap: anywhere; }
      .todo-slot small { display: block; max-width: 88%; margin-top: 12px; color: #f7f2df; font-size: 14px; line-height: 1.25; opacity: .76; overflow-wrap: anywhere; }
      .caption-line {
        z-index: 30;
        left: 50%;
        bottom: 34px;
        width: min(1560px, calc(100% - 260px));
        transform: translateX(-50%);
        color: #fffdf5;
        font-size: 46px;
        line-height: 1.14;
        font-style: italic;
        font-weight: 950;
        text-align: center;
        letter-spacing: 0;
        text-shadow:
          0 4px 0 rgba(0,0,0,.88),
          0 0 10px rgba(0,0,0,.95),
          0 0 22px rgba(0,0,0,.75);
      }
      .caption-line::before {
        content: "";
        position: absolute;
        z-index: -1;
        left: 50%;
        top: 50%;
        width: calc(100% + 54px);
        height: calc(100% + 20px);
        transform: translate(-50%, -50%);
        border-radius: 12px;
        background: linear-gradient(90deg, transparent, rgba(0,0,0,.42) 16%, rgba(0,0,0,.42) 84%, transparent);
      }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${(lock.duration - renderStart).toFixed(3)}" data-width="${lock.width}" data-height="${lock.height}">
      ${scenes.map(renderScene).join("\n")}
      ${mediaLayers.join("\n")}
      ${captions.map(captionLayer).join("\n")}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      document.querySelectorAll(".scene").forEach((scene) => {
        const start = Number(scene.dataset.start);
        tl.from(scene.querySelectorAll(".split-panel, .split-video-frame, .screen-stage, .pip-frame, .title-card, .step-card, .proof-stage, .stat-shell, .hero-overlay"), {
          opacity: 0,
          y: 24,
          duration: 0.36,
          stagger: 0.08,
          ease: "power3.out",
          overwrite: "auto"
        }, start + 0.12);
      });
      window.__timelines.main = tl;
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(root, "index.html"), html);
console.log(`Generated index.html from ${scenes.length} locked scenes${verifyTail ? " for 120-390.77s verification tail" : tailFinal ? " for 120-390.77s final tail" : ""}.`);
