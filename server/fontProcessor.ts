import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const MAX_FONT_BYTES = 50 * 1024 * 1024;
const PROCESS_TIMEOUT_MS = 45_000;

function runPython(scriptName: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), "scripts", scriptName);
    const child = spawn("python3", [scriptPath, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("انتهت مهلة معالجة الخط"));
    }, PROCESS_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || `FontTools exited with code ${code ?? "unknown"}`));
      }
    });
  });
}

export async function inspectFontAxes(input: Buffer) {
  if (input.byteLength === 0) throw new Error("ملف الخط فارغ");
  if (input.byteLength > MAX_FONT_BYTES) throw new Error("حجم الخط يتجاوز الحد المسموح 50MB");
  const tempDir = path.join(os.tmpdir(), `opentype-axes-${randomUUID()}`);
  await mkdir(tempDir, { recursive: true });
  const inputPath = path.join(tempDir, "source-font");
  try {
    await writeFile(inputPath, input);
    const output = await runPython("read_font_axes.py", [inputPath]);
    return JSON.parse(output) as Array<{ tag: string; name: string; min: number; default: number; max: number }>;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function bakeFontFeatures(input: Buffer, features: string[], axes: Record<string, number> = {}) {
  if (input.byteLength === 0) throw new Error("ملف الخط فارغ");
  if (input.byteLength > MAX_FONT_BYTES) throw new Error("حجم الخط يتجاوز الحد المسموح 50MB");

  const normalizedFeatures = Array.from(new Set(features.map((feature) => feature.trim().toLowerCase())))
    .filter((feature) => /^[a-z0-9]{4}$/.test(feature));
  if (normalizedFeatures.length === 0) throw new Error("لم يتم اختيار خصائص OpenType صالحة");

  const tempDir = path.join(os.tmpdir(), `opentype-${randomUUID()}`);
  await mkdir(tempDir, { recursive: true });
  const inputPath = path.join(tempDir, "source-font");
  const outputPath = path.join(tempDir, "embedded-font.ttf");

  try {
    await writeFile(inputPath, input);
    const log = await runPython("embed_font_features.py", [inputPath, outputPath, normalizedFeatures.join(","), JSON.stringify(axes)]);
    const output = await readFile(outputPath);
    return { output, log, features: normalizedFeatures };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export { MAX_FONT_BYTES };
