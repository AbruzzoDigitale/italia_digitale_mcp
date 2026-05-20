import { execSync } from "child_process";
import { statSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registry } from "../registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// build/tools/system/tools.js → su 3 livelli → root del progetto
const PROJECT_ROOT = resolve(__dirname, "../../..");

function run(cmd: string): string {
  return execSync(cmd, { cwd: PROJECT_ROOT, encoding: "utf-8" }).trim();
}

export function registerSystemTools(server: McpServer): void {

  registry.add({ name: "aggiorna", title: "Aggiorna il Server MCP", category: "🔧 Sistema",
    description: "Controlla aggiornamenti su Git. Se disponibili, scarica le modifiche e ricompila il server.",
  });
  registry.add({ name: "aiuto", title: "Guida ai comandi MCP", category: "🔧 Sistema",
    description: "Elenca tutti i comandi disponibili con parametri ed esempi. Si aggiorna automaticamente quando vengono aggiunti nuovi tool.",
  });

  server.registerTool(
    "aggiorna",
    {
      title: "Aggiorna il Server MCP",
      description:
        "Controlla se ci sono aggiornamenti disponibili su Git. " +
        "Se trovati, scarica le modifiche (git pull) e ricompila il server (npm run build). " +
        "Usa questo comando per mantenere il server all'ultima versione.",
      inputSchema: {},
    },
    async () => {
      const lines: string[] = [];

      try {
        // Recupera i riferimenti remoti senza modificare il working tree
        run("git fetch origin");

        const localHead = run("git rev-parse HEAD");
        const remoteHead = run("git rev-parse @{u}");
        const shortHash = localHead.slice(0, 7);
        const commitDate = run("git log -1 --format=%ci HEAD");
        const pkgVersion = run("node -e \"const p=require('./package.json');console.log(p.version)\"");

        const versionLine = `📌 Versione attuale: v${pkgVersion} · commit ${shortHash} · ${commitDate}`;

        if (localHead === remoteHead) {
          return {
            content: [
              {
                type: "text",
                text: `✅ Il server è già all'ultima versione.\n${versionLine}`,
              },
            ],
          };
        }

        // Mostra i commit in arrivo
        const incoming = run("git log HEAD..@{u} --oneline");
        lines.push("📦 Aggiornamenti disponibili:");
        lines.push(incoming);
        lines.push("");

        // Scarica gli aggiornamenti
        lines.push("⬇️  Download in corso (git pull)...");
        run("git pull --ff-only origin");
        lines.push("✅ Codice aggiornato.");
        lines.push("");

        // Installa dipendenze solo se package.json è cambiato dall'ultimo install
        const pkgJson      = join(PROJECT_ROOT, "package.json");
        const installedLock = join(PROJECT_ROOT, "node_modules", ".package-lock.json");
        const needsInstall  = !existsSync(installedLock) ||
          statSync(pkgJson).mtimeMs > statSync(installedLock).mtimeMs;

        if (needsInstall) {
          lines.push("📦 Installazione dipendenze (npm install)...");
          run("npm install --prefer-offline --no-audit --no-fund");
          lines.push("✅ Dipendenze aggiornate.");
        } else {
          lines.push("✅ Dipendenze già aggiornate, skip npm install.");
        }
        lines.push("");

        // Ricompila
        lines.push("🔨 Ricompilazione in corso (npm run build)...");
        run("npm run build");
        lines.push("✅ Build completata.");
        lines.push("");

        const newHash = run("git rev-parse HEAD").slice(0, 7);
        const newDate = run("git log -1 --format=%ci HEAD");
        const newPkgVersion = run("node -e \"const p=require('./package.json');console.log(p.version)\"");
        lines.push(`📌 Nuova versione: v${newPkgVersion} · commit ${newHash} · ${newDate}`);
        lines.push("");
        lines.push("⚠️  Riavvia il server MCP perché le modifiche abbiano effetto.");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        lines.push("❌ Errore durante l'aggiornamento:");
        lines.push(message);
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    }
  );

  // ─── AIUTO ────────────────────────────────────────────────────────────────

  server.registerTool(
    "aiuto",
    {
      title: "Guida ai comandi MCP",
      description:
        "Elenca tutti i comandi disponibili nel server MCP con descrizione, parametri e esempi d'uso. " +
        "Usa questo tool per scoprire cosa puoi fare e come.",
      inputSchema: {},
    },
    async () => {
      return { content: [{ type: "text", text: registry.format() }] };
    }
  );
}
