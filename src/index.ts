import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTrelloTools } from "./tools/trello/tools.js";
import { registerSystemTools } from "./tools/system/tools.js";

const server = new McpServer({
  name: "italia-digitale-mcp",
  version: "1.0.0",
});

registerTrelloTools(server);
registerSystemTools(server);

// ─── AVVIO ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ MCP Server avviato con successo!");
}

main().catch((err) => {
  console.error("❌ Errore avvio server:", err);
  process.exit(1);
});
