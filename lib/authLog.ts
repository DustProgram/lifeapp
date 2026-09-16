import { appendFile, mkdir, readFile } from "fs/promises";
import path from "path";
import type { AuthLogEntry } from "./types";

// Connection history for the security journal, stored as JSON Lines so a
// simple append is atomic enough and the file stays greppable.
const LOG_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "auth-log.jsonl");

export async function appendAuthLog(entry: AuthLogEntry): Promise<void> {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    // Logging must never break the login flow itself.
    console.error("auth-log write failed:", err);
  }
}

export async function readAuthLog(limit = 200): Promise<AuthLogEntry[]> {
  try {
    const raw = await readFile(LOG_FILE, "utf8");
    const lines = raw.trim().split("\n");
    return lines
      .slice(-limit)
      .map((l) => {
        try {
          return JSON.parse(l) as AuthLogEntry;
        } catch {
          return null;
        }
      })
      .filter((e): e is AuthLogEntry => e !== null)
      .reverse(); // newest first
  } catch {
    return [];
  }
}
