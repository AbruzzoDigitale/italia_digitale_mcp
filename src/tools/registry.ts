export interface ParamDoc {
  name: string;
  type: string;
  required: boolean;
  values?: string;
  description: string;
}

export interface ToolDoc {
  name: string;
  title: string;
  description: string;
  category: string;
  params?: ParamDoc[];
}

class ToolRegistry {
  private tools: ToolDoc[] = [];

  add(doc: ToolDoc): void {
    this.tools.push(doc);
  }

  getAll(): ToolDoc[] {
    return [...this.tools];
  }

  format(): string {
    const byCategory = new Map<string, ToolDoc[]>();
    for (const tool of this.tools) {
      if (!byCategory.has(tool.category)) byCategory.set(tool.category, []);
      byCategory.get(tool.category)!.push(tool);
    }

    const lines: string[] = ["# 📖 Guida ai comandi del server MCP\n"];

    for (const [category, tools] of byCategory) {
      lines.push(`---\n\n## ${category}\n`);
      for (const tool of tools) {
        lines.push(`### \`${tool.name}\``);
        lines.push(tool.description);
        if (tool.params && tool.params.length > 0) {
          lines.push("");
          lines.push("| Parametro | Tipo | Req | Valori | Descrizione |");
          lines.push("|-----------|------|:---:|--------|-------------|");
          for (const p of tool.params) {
            const req = p.required ? "✅" : "❌";
            const values = p.values ?? "—";
            lines.push(`| \`${p.name}\` | ${p.type} | ${req} | ${values} | ${p.description} |`);
          }
        }
        lines.push("");
      }
    }

    return lines.join("\n").trim();
  }
}

export const registry = new ToolRegistry();
