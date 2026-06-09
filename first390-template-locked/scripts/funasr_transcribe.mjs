import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const audio = process.argv[2] || "production/audio/duix-first390-master-v4.wav";
const scriptPath = process.argv[3] || "production/full-script-390-v4.txt";
const outRaw = process.argv[4] || "production/audio/funasr-duix-first390-master-v4.raw.json";
const outCaptions = process.argv[5] || "production/audio/captions-duix-first390-master-v4.json";

function normalizeSentenceInfo(raw) {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first) return [];
  if (Array.isArray(first.sentence_info) && first.sentence_info.length) {
    return first.sentence_info.map((s) => ({
      start: Number(s.start) / 1000,
      end: Number(s.end) / 1000,
      asrText: s.text || "",
    }));
  }
  if (Array.isArray(first.timestamp) && first.timestamp.length) {
    return first.timestamp.map((pair, index) => ({
      start: Number(pair[0]) / 1000,
      end: Number(pair[1]) / 1000,
      asrText: `word-${index + 1}`,
    }));
  }
  return [];
}

function fixTerms(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/八十万人/g, "80万人")
    .replace(/一九二零乘一零八零/g, "1920x1080")
    .replace(/页源框架/g, "开源框架")
    .replace(/简也是/g, "这也是")
    .replace(/头哥不请自来/g, "投哥不请自来")
    .replace(/制包作/g, "制作")
    .replace(/对于政才来说/g, "对 Agent 来说")
    .replace(/a 站的/g, "Agent")
    .replace(/MP 四/gi, "MP4")
    .replace(/hyper frame studio/gi, "HyperFrames Studio")
    .replace(/cocox|cocods|codeks|c o d e x/gi, "Codex")
    .replace(/codex/gi, "Codex")
    .replace(/cloud code|claude code|cloudcode/gi, "Claude Code")
    .replace(/remotion/gi, "Remotion")
    .replace(/agent/gi, "Agent")
    .replace(/hyyfframes|hyper frames|hyperforms|hyperframe ts|hyperframe es|hyperframes|hyperfrarax|hyperframets/gi, "HyperFrames")
    .replace(/HTMLCSS\s*javascript/gi, "HTML、CSS、JavaScript")
    .replace(/html/gi, "HTML")
    .replace(/css/gi, "CSS")
    .replace(/javascript/gi, "JavaScript")
    .replace(/ffmpeg/gi, "FFmpeg")
    .replace(/chrome/gi, "Chrome")
    .replace(/design\.md/gi, "Design.md")
    .replace(/storyboard\.md/gi, "storyboard.md")
    .replace(/srt/gi, "SRT")
    .replace(/asr/gi, "ASR")
    .replace(/duix/gi, "DUIX")
    .replace(/ ，/g, "，")
    .replace(/ 。/g, "。")
    .trim();
}

function splitLongCaption(caption, maxChars = 34) {
  if (caption.text.length <= maxChars) return [caption];
  const parts = caption.text.match(/[^，。！？；;,.!?]+[，。！？；;,.!?]?/g) || [caption.text];
  if (parts.length <= 1) return [caption];
  const usable = parts.map((part) => part.trim()).filter(Boolean);
  const totalChars = usable.reduce((sum, part) => sum + part.length, 0);
  let cursor = caption.start;
  return usable.map((part, index) => {
    const isLast = index === usable.length - 1;
    const duration = isLast
      ? caption.end - cursor
      : ((caption.end - caption.start) * part.length) / totalChars;
    const start = cursor;
    const end = isLast ? caption.end : cursor + duration;
    cursor = end;
    return {
      ...caption,
      start: Number(start.toFixed(3)),
      end: Number(end.toFixed(3)),
      text: part,
    };
  }).filter((item) => item.end > item.start);
}

function makeFunasrCaptions(sentences) {
  const captions = [];
  for (const sentence of sentences) {
    const text = fixTerms(sentence.asrText || "");
    if (!text || /^[，,。.!?！？；;：:]+$/.test(text)) continue;
    const base = {
      start: Number(sentence.start.toFixed(3)),
      end: Number(sentence.end.toFixed(3)),
      text,
      source: "funasr_sentence_with_term_fixes",
      asr_text: sentence.asrText || "",
    };
    captions.push(...splitLongCaption(base));
  }
  return captions;
}

const audioAbs = path.resolve(projectRoot, audio);
const scriptAbs = path.resolve(projectRoot, scriptPath);
const outRawAbs = path.resolve(projectRoot, outRaw);
const outCaptionsAbs = path.resolve(projectRoot, outCaptions);
fs.mkdirSync(path.dirname(outRawAbs), { recursive: true });
fs.mkdirSync(path.dirname(outCaptionsAbs), { recursive: true });

const py = `
from funasr import AutoModel
import json, sys
audio = sys.argv[1]
out = sys.argv[2]
hotword = "Codex Remotion HyperFrames Claude Code Agent DUIX ASR SRT HTML CSS JavaScript FFmpeg Chrome Design.md storyboard.md"
model = AutoModel(
    model="paraformer-zh",
    vad_model="fsmn-vad",
    punc_model="ct-punc",
    device="cpu",
    disable_update=True,
)
res = model.generate(
    input=audio,
    batch_size_s=300,
    hotword=hotword,
    sentence_timestamp=True,
)
with open(out, "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False, indent=2)
`;

if (!fs.existsSync(outRawAbs) || process.env.FORCE_FUNASR === "1") {
  const result = spawnSync(
    "/Users/serva/miniconda3/envs/cosyvoice/bin/python",
    ["-c", py, audioAbs, outRawAbs],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status || 1);
} else {
  console.log(`Reusing existing FunASR raw JSON: ${outRaw}`);
}

const raw = JSON.parse(fs.readFileSync(outRawAbs, "utf8"));
const sentences = normalizeSentenceInfo(raw);
const captions = makeFunasrCaptions(sentences);
const payload = {
  source_audio: audio,
  source_script: scriptPath,
  timing_source: outRaw,
  caption_text_policy: "FunASR sentence timestamps and recognized text with product-term fixes",
  stats: {
    funasr_sentences: sentences.length,
    captions: captions.length,
    punctuation_only_removed: sentences.length - captions.filter((c) => c.source === "funasr_sentence_with_term_fixes").length,
  },
  captions,
};
fs.writeFileSync(outCaptionsAbs, JSON.stringify(payload, null, 2), "utf8");
console.log(JSON.stringify(payload.stats, null, 2));
