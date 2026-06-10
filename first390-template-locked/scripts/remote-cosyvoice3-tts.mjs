import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function usage() {
  console.error(
    [
      "Usage:",
      "  COSYVOICE3_MASTER_API_BASE_URL=http://host:port node scripts/remote-cosyvoice3-tts.mjs --text-file input.txt --output out.wav [--speed 1.0] [--meta out.json]",
      "  COSYVOICE3_MASTER_API_BASE_URL=http://host:port node scripts/remote-cosyvoice3-tts.mjs --text '中文文本' --output out.wav"
    ].join("\n")
  );
}

function parseArgs(argv) {
  const args = { speed: 1.0 };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      throw new Error(`unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`missing value for --${key}`);
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`POST ${url} failed ${response.status}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`POST ${url} returned non-JSON response: ${text.slice(0, 500)}`);
  }
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GET ${url} failed ${response.status}: ${text.slice(0, 500)}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 44 || buffer.subarray(0, 4).toString("ascii") !== "RIFF") {
    throw new Error(`downloaded payload is not a WAV RIFF file: ${url}`);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
}

async function main() {
  const args = parseArgs(process.argv);
  const baseUrl = process.env.COSYVOICE3_MASTER_API_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("COSYVOICE3_MASTER_API_BASE_URL is required");
  }
  if (!args.output) {
    throw new Error("--output is required");
  }
  const speed = Number(args.speed);
  if (!Number.isFinite(speed) || speed <= 0.5 || speed >= 1.5) {
    throw new Error("--speed must be > 0.5 and < 1.5");
  }

  let text = args.text || "";
  if (args["text-file"]) {
    text = fs.readFileSync(args["text-file"], "utf8");
  }
  text = text.trim();
  if (!text) {
    throw new Error("--text or --text-file is required");
  }
  if (text.length > 1200) {
    throw new Error(`text is ${text.length} chars; remote API limit is 1200 chars`);
  }

  const meta = await postJson(`${baseUrl}/tts`, { text, speed });
  if (!meta.ok || !meta.download_url) {
    throw new Error(`remote CosyVoice3 returned invalid metadata: ${JSON.stringify(meta)}`);
  }

  const downloadUrl = new URL(meta.download_url, `${baseUrl}/`).toString();
  await downloadFile(downloadUrl, args.output);

  const metaPath = args.meta || `${args.output}.json`;
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        provider: "remote_cosyvoice3_master_api",
        text,
        speed,
        output: args.output,
        download_url: meta.download_url,
        sample_rate: meta.sample_rate,
        channels: meta.channels,
        duration_sec: meta.duration_sec,
        wall_sec: meta.wall_sec,
        rtf: meta.rtf
      },
      null,
      2
    )
  );

  console.log(`OK remote CosyVoice3: ${args.output}`);
  console.log(`duration=${meta.duration_sec}s sample_rate=${meta.sample_rate} channels=${meta.channels} wall=${meta.wall_sec}s rtf=${meta.rtf}`);
}

main().catch((error) => {
  usage();
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
