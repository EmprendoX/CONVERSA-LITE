import fs from "fs/promises";
import path from "path";

const logsDir = path.resolve(process.cwd(), "logs");
const sendsPath = path.join(logsDir, "sends.jsonl");
const MAX_FILE_BYTES = 1_000_000; // ~1MB

export async function appendSendLog(entry) {
  await fs.mkdir(logsDir, { recursive: true });
  const line = JSON.stringify({ ...entry, ts: new Date().toISOString() }) + "\n";
  try {
    const stat = await fs.stat(sendsPath);
    if (stat.size + Buffer.byteLength(line) > MAX_FILE_BYTES) {
      const rotated = path.join(logsDir, `sends-${Date.now()}.jsonl`);
      await fs.rename(sendsPath, rotated);
    }
  } catch {}
  await fs.appendFile(sendsPath, line, "utf8");
}

export async function readLastSends(limit = 50) {
  try {
    const raw = await fs.readFile(sendsPath, "utf8");
    const lines = raw.trim().split(/\n+/).slice(-limit);
    return lines.map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

export default { appendSendLog, readLastSends };


