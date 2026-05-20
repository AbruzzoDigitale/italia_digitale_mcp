#!/usr/bin/env node
"use strict";

const readline = require("readline");
const fs       = require("fs");
const path     = require("path");
const os       = require("os");
const { execSync } = require("child_process");

// ─── Colori ANSI (disabilitati su Windows senza supporto VT) ──────────────────
const isWin = process.platform === "win32";
const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  cyan:   "\x1b[36m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  gray:   "\x1b[90m",
};
const ok   = (m) => console.log(`${c.green}  OK  ${c.reset}${m}`);
const info = (m) => console.log(`${c.cyan}  ...  ${c.reset}${m}`);
const warn = (m) => console.log(`${c.yellow}  !    ${c.reset}${m}`);
const err  = (m) => { console.log(`${c.red}  ERR  ${c.reset}${m}`); process.exit(1); };
const sep  = ()  => console.log(`${c.gray}${"─".repeat(46)}${c.reset}`);

// ─── Directory di installazione (fissa, indipendente dalla posizione dell'exe) ─
// NON usare __dirname: dentro un binario pkg è un percorso virtuale (/snapshot/…)
const REPO_URL   = "https://github.com/AbruzzoDigitale/italia_digitale_mcp.git";
const PROJECT_DIR = isWin
  ? path.join(os.homedir(), "AppData", "Local", "AbruzzoDigitale", "italia-digitale-mcp")
  : path.join(os.homedir(), ".local", "share", "italia-digitale-mcp");

// ─── Path Claude Desktop config (per OS) ──────────────────────────────────────
function getClaudeConfigPath() {
  switch (process.platform) {
    case "win32":
      return path.join(process.env.APPDATA || "", "Claude", "claude_desktop_config.json");
    case "darwin":
      return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
    default:
      return path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json");
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.clear();
  console.log(`\n${c.bold}${c.cyan}  Italia Digitale MCP — Installer${c.reset}\n`);
  sep();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // ── 1. Verifica Node.js ──────────────────────────────────────────────────
  info("Verifica Node.js...");
  try {
    const ver = execSync("node -v", { encoding: "utf-8" }).trim();
    const major = parseInt(ver.replace("v", "").split(".")[0]);
    if (major < 18) err(`Node.js 18+ richiesto. Installato: ${ver}\nScarica da: https://nodejs.org`);
    ok(`Node.js ${ver} trovato.`);
  } catch {
    err("Node.js non trovato.\nScarica e installa Node.js 18+ da: https://nodejs.org\nPoi esegui di nuovo questo installer.");
  }

  // ── 1b. Verifica Git ──────────────────────────────────────────────────────
  info("Verifica Git...");
  try {
    const gitVer = execSync("git --version", { encoding: "utf-8" }).trim();
    ok(`${gitVer} trovato.`);
  } catch {
    err("Git non trovato.\nScarica e installa Git da: https://git-scm.com\nPoi esegui di nuovo questo installer.");
  }

  // ── 2. Clona o aggiorna il repo ───────────────────────────────────────────
  sep();
  const buildPath = path.join(PROJECT_DIR, "build", "index.js");
  const gitDir    = path.join(PROJECT_DIR, ".git");

  if (!fs.existsSync(gitDir)) {
    info(`Scarico il server in:\n     ${PROJECT_DIR}`);
    fs.mkdirSync(path.dirname(PROJECT_DIR), { recursive: true });
    try {
      execSync(`git clone "${REPO_URL}" "${PROJECT_DIR}"`, { stdio: "inherit" });
      ok("Repository scaricato.");
    } catch {
      err("Errore durante il download del repository.\nVerifica la connessione internet e riprova.");
    }
  } else {
    info("Repository già presente. Aggiorno all'ultima versione...");
    try {
      execSync("git pull --ff-only origin main", { cwd: PROJECT_DIR, stdio: "inherit" });
      ok("Repository aggiornato.");
    } catch {
      warn("Impossibile aggiornare automaticamente. Continuo con la versione esistente.");
    }
  }

  // ── 3. npm install + build ────────────────────────────────────────────────
  sep();
  info("Installo le dipendenze (npm install)...");
  try {
    execSync("npm install --silent", { cwd: PROJECT_DIR, stdio: "inherit" });
    ok("Dipendenze installate.");
  } catch {
    err("Errore durante npm install.\nVerifica la connessione internet e riprova.");
  }

  if (!fs.existsSync(buildPath)) {
    info("Compilo il server (npm run build)...");
    try {
      execSync("npm run build", { cwd: PROJECT_DIR, stdio: "inherit" });
      ok("Build completata.");
    } catch {
      err("Errore durante la compilazione.\nVerifica che Node.js e npm siano installati correttamente.");
    }
  } else {
    ok("Build trovata.");
  }

  // ── 4. Credenziali Trello ─────────────────────────────────────────────────
  sep();
  console.log(`\n${c.bold}  Credenziali Trello${c.reset}`);
  console.log(`\n  Ottieni API Key e Token su: ${c.cyan}https://trello.com/app-key${c.reset}\n`);

  const apiKey = (await ask(rl, "  API Key : ")).trim();
  if (!apiKey) err("API Key non può essere vuota.");

  const token = (await ask(rl, "  Token   : ")).trim();
  if (!token) err("Token non può essere vuoto.");

  const credsPath = path.join(os.homedir(), ".config", "italia-digitale-mcp", "credentials.json");
  writeJson(credsPath, { trello: { apiKey, token } });

  // Permessi solo-owner su macOS/Linux
  if (!isWin) {
    try { fs.chmodSync(credsPath, 0o600); } catch {}
  }

  ok(`Credenziali salvate in ${credsPath}`);

  // ── 5. Claude Desktop config ──────────────────────────────────────────────
  sep();
  info("Configurazione Claude Desktop...");

  const claudeConfigPath = getClaudeConfigPath();
  const config = readJson(claudeConfigPath);
  if (!config.mcpServers) config.mcpServers = {};

  config.mcpServers["italia-digitale-mcp"] = {
    command: "node",
    args: [buildPath],
  };

  writeJson(claudeConfigPath, config);
  ok(`Server registrato in ${claudeConfigPath}`);

  rl.close();

  // ── 6. Fine ───────────────────────────────────────────────────────────────
  sep();
  console.log(`\n${c.bold}${c.green}  Installazione completata!${c.reset}\n`);
  console.log(`  ${c.bold}Prossimo passo:${c.reset} ${c.yellow}riavvia Claude Desktop${c.reset} per attivare il server.\n`);
  console.log(`  Per verificare, scrivi a Claude:`);
  console.log(`  ${c.cyan}"Aiuto"${c.reset}  →  lista comandi disponibili`);
  console.log(`  ${c.cyan}"Aggiorna il server MCP"${c.reset}  →  controlla aggiornamenti\n`);
  sep();

  if (isWin) {
    await ask(readline.createInterface({ input: process.stdin, output: process.stdout }), "\n  Premi INVIO per chiudere...");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
