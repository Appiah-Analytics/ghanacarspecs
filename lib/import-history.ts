import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const HISTORY_DIR = path.join(process.cwd(), "prisma", "data");
const HISTORY_FILE = path.join(HISTORY_DIR, "import-history.json");
const MAX_STORED_ENTRIES = 50;

export type ImportHistoryEntry = {
  id: string;
  timestamp: string;
  filename: string;
  rowsProcessed: number;
  imported: number;
  skipped: number;
  warnings: number;
  qualityScore: number;
  eventsInserted: number;
  eventsSkipped: number;
  duplicateEventsSkipped: number;
};

type ImportHistoryFile = {
  entries: ImportHistoryEntry[];
};

async function readHistoryFile(): Promise<ImportHistoryFile> {
  try {
    const raw = await readFile(HISTORY_FILE, "utf8");
    const parsed = JSON.parse(raw) as ImportHistoryFile;
    if (!parsed || !Array.isArray(parsed.entries)) {
      return { entries: [] };
    }
    return parsed;
  } catch {
    return { entries: [] };
  }
}

async function writeHistoryFile(data: ImportHistoryFile): Promise<void> {
  await mkdir(HISTORY_DIR, { recursive: true });
  await writeFile(HISTORY_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function importHistoryStoragePath(): string {
  return HISTORY_FILE;
}

export async function appendImportHistory(entry: Omit<ImportHistoryEntry, "id" | "timestamp">): Promise<ImportHistoryEntry> {
  const record: ImportHistoryEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const file = await readHistoryFile();
  const entries = [record, ...file.entries].slice(0, MAX_STORED_ENTRIES);
  await writeHistoryFile({ entries });

  return record;
}

export async function getRecentImportHistory(limit = 10): Promise<ImportHistoryEntry[]> {
  const file = await readHistoryFile();
  return file.entries.map((entry) => ({
    ...entry,
    eventsInserted: entry.eventsInserted ?? entry.imported ?? 0,
    eventsSkipped: entry.eventsSkipped ?? 0,
    duplicateEventsSkipped: entry.duplicateEventsSkipped ?? 0,
  })).slice(0, limit);
}
