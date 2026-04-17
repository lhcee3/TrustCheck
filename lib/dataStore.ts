import fs from "fs";
import path from "path";

const isVercel = process.env.VERCEL === "1";
const TMP_DIR = "/tmp/xpressbank-data";
const SEED_DIR = path.join(process.cwd(), "data");

function ensureSeeded(filename: string): string {
  if (!isVercel) {
    return path.join(SEED_DIR, filename);
  }
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  const tmpPath = path.join(TMP_DIR, filename);
  if (!fs.existsSync(tmpPath)) {
    const seedPath = path.join(SEED_DIR, filename);
    if (fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, tmpPath);
    } else {
      fs.writeFileSync(tmpPath, "[]");
    }
  }
  return tmpPath;
}

export function readData<T>(filename: string): T {
  const filePath = ensureSeeded(filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export function writeData<T>(filename: string, data: T): void {
  const filePath = ensureSeeded(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
