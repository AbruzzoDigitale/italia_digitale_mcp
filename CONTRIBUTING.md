# Contributing — Branching & Commit Guidelines

These rules ensure a clean and consistent workflow. Always follow these guidelines when working on this repository.

---

## Repository Branches

| Branch | Scope |
|--------|-------|
| `dev` | Development — main branch for active work |
| `main` | Production — only stable, reviewed code |

All work starts from `dev`. Only validated code reaches `main`.

---

## Branch Naming

For each new task, create a branch from `dev` using this convention:

| Type | Description | Example |
|------|-------------|---------|
| `feat/` | New feature or new tool | `feat/webhooks-support` |
| `fix/` | Bug fix | `fix/auth-params-missing` |
| `docs/` | Documentation only | `docs/readme-setup` |
| `refactor/` | Refactoring without new features | `refactor/trello-client` |
| `test/` | Tests added or modified | `test/get-boards` |
| `chore/` | Maintenance, dependencies, build | `chore/update-sdk` |

> Always use short and descriptive names in kebab-case.

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:

```
<type>: <short description>
```

**Examples:**

```
feat: add search_trello tool
fix: handle missing TRELLO_TOKEN at startup
docs: update Claude Desktop config section in README
refactor: extract auth params to shared constant
chore: upgrade @modelcontextprotocol/sdk to 1.13.0
```

- Write in **English**
- Keep the subject line under 72 characters
- Every commit must compile (`npm run build` must succeed)

---

## Pull Requests

1. Complete your work in the feature branch
2. Open a PR targeting `dev`
3. At least one team member must perform a code review
4. After approval → merge into `dev`
5. Delete the branch after merge

---

## From `dev` to `main`

When `dev` is stable: open a PR `dev → main`.  
After review → merge into `main` → production release.

---

## Adding a New Domain (Tool Group) — Checklist

Each new domain (e.g. `attachments`, `webhooks`) follows this structure:

- [ ] Add API functions in `src/trello.ts` (or create `src/<domain>.ts` if large)
- [ ] Import and register the new tools in `src/index.ts`
- [ ] Export new functions correctly (named exports)
- [ ] Build compiles without errors: `npm run build`
- [ ] Update the **Tool disponibili** table in `README.md`
- [ ] Update `CONTRIBUTING.md` if workflow changes

---

## Important Rules

- No direct pushes to `main` or `dev`
- All PRs must be reviewed before merging
- Delete branches after merge
- **Never commit `.env` or any credentials**
- All secrets must be injected via environment variables at runtime

---

## Workflow Summary

```bash
# Start from dev
git checkout dev
git pull origin dev

# Create your feature branch
git checkout -b feat/my-feature

# Work, commit, push
git add .
git commit -m "feat: add my feature"
git push origin feat/my-feature

# Open PR → review → merge into dev
# Periodically: dev → main for production release
```

---

## Pubblicare una nuova Release

Quando `main` contiene una versione stabile da distribuire:

1. **Aggiorna la versione** in `package.json` (seguendo [semver](https://semver.org/))
2. **Esegui build e compilazione binari:**
   ```bash
   npm run build
   npm run build:exe
   ```
3. **Crea la tag e pubblica la release su GitHub:**
   ```bash
   gh release create v1.x.x dist/* \
     --title "v1.x.x — Descrizione" \
     --notes "Cosa è cambiato in questa versione"
   ```
4. I 4 binari in `dist/` vengono allegati automaticamente:
   - `italia-digitale-mcp-installer-win-x64.exe`
   - `italia-digitale-mcp-installer-macos-arm64`
   - `italia-digitale-mcp-installer-macos-x64`
   - `italia-digitale-mcp-installer-linux-x64`

> La cartella `dist/` è in `.gitignore` — i binari vengono distribuiti **solo** tramite GitHub Releases, mai committati nel repo.

---

## Code Conventions

- **TypeScript** with strict mode enabled (`tsconfig.json`)
- **ES Modules** (`"type": "module"` in `package.json`)
- Named exports only — no default exports
- Input validation via `zod` schemas on all tool `inputSchema` definitions
- One responsibility per file — API client logic in `trello.ts`, tool registration in `index.ts`
- No secrets hardcoded — always read from `process.env`
