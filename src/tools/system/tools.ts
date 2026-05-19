import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// build/tools/system/tools.js → su 3 livelli → root del progetto
const PROJECT_ROOT = resolve(__dirname, "../../..");

function run(cmd: string): string {
  return execSync(cmd, { cwd: PROJECT_ROOT, encoding: "utf-8" }).trim();
}

export function registerSystemTools(server: McpServer): void {
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

        if (localHead === remoteHead) {
          return {
            content: [
              {
                type: "text",
                text: "✅ Il server è già all'ultima versione. Nessun aggiornamento disponibile.",
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

        // Ricompila
        lines.push("🔨 Ricompilazione in corso (npm run build)...");
        run("npm run build");
        lines.push("✅ Build completata.");
        lines.push("");
        lines.push(
          "⚠️  Riavvia il server MCP perché le modifiche abbiano effetto."
        );
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
}
