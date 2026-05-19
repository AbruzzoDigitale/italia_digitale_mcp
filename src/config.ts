import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".config", "italia-digitale-mcp");
const CONFIG_FILE = join(CONFIG_DIR, "credentials.json");

export interface Credentials {
  trello?: {
    apiKey: string;
    token: string;
  };
}

export function loadCredentials(): Credentials {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function saveCredentials(update: Partial<Credentials>): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const existing = loadCredentials();
  const merged = { ...existing, ...update };
  // mode 0o600: solo il proprietario può leggere/scrivere il file
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), { encoding: "utf-8", mode: 0o600 });
}

export function getCredentialsPath(): string {
  return CONFIG_FILE;
}
