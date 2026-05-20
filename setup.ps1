# Italia Digitale MCP — Setup per Windows
# Richiede PowerShell 5+ e Node.js 18+
# Eseguire con: powershell -ExecutionPolicy Bypass -File setup.ps1

$ErrorActionPreference = "Stop"

# ─── Funzioni output ──────────────────────────────────────────────────────────
function Ok($msg)   { Write-Host "OK  $msg" -ForegroundColor Green }
function Info($msg) { Write-Host "... $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "!   $msg" -ForegroundColor Yellow }
function Err($msg)  { Write-Host "ERR $msg" -ForegroundColor Red; exit 1 }
function Sep()      { Write-Host ("-" * 45) -ForegroundColor DarkGray }

# ─── Header ───────────────────────────────────────────────────────────────────
Clear-Host
Write-Host ""
Write-Host "  Italia Digitale MCP — Setup" -ForegroundColor Cyan -NoNewline
Write-Host " (Windows)" -ForegroundColor DarkGray
Write-Host ""
Sep

# ─── 1. Prerequisiti ──────────────────────────────────────────────────────────
Info "Controllo prerequisiti..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Err "Node.js non trovato. Installa da https://nodejs.org"
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Err "npm non trovato. Installa Node.js da https://nodejs.org"
}

$nodeVersion = [int](node -e "process.stdout.write(process.versions.node.split('.')[0])")
if ($nodeVersion -lt 18) {
    Err "Node.js 18+ richiesto. Versione attuale: $(node -v)"
}

Ok "Node.js $(node -v)  npm $(npm -v)"

# ─── 2. Directory del progetto ────────────────────────────────────────────────
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Info "Directory: $ScriptDir"

# ─── 3. Dipendenze e build ────────────────────────────────────────────────────
Sep
Info "Installazione dipendenze..."
npm install --silent
Ok "Dipendenze installate."

Info "Compilazione TypeScript..."
npm run build
Ok "Build completata -> build/index.js"

# ─── 4. Credenziali Trello ────────────────────────────────────────────────────
Sep
Write-Host ""
Write-Host "  Credenziali Trello" -ForegroundColor White
Write-Host ""
Write-Host "  Ottieni API Key e Token su: https://trello.com/app-key"
Write-Host ""

$TrelloApiKey = Read-Host "  API Key"
if ([string]::IsNullOrWhiteSpace($TrelloApiKey)) { Err "API Key non puo' essere vuota." }

$TrelloToken = Read-Host "  Token"
if ([string]::IsNullOrWhiteSpace($TrelloToken)) { Err "Token non puo' essere vuoto." }

$CredsDir  = Join-Path $HOME ".config\italia-digitale-mcp"
$CredsFile = Join-Path $CredsDir "credentials.json"
New-Item -ItemType Directory -Force -Path $CredsDir | Out-Null

$creds = @{
    trello = @{
        apiKey = $TrelloApiKey
        token  = $TrelloToken
    }
} | ConvertTo-Json -Depth 3

Set-Content -Path $CredsFile -Value $creds -Encoding UTF8

# Permessi solo per l'utente corrente
$acl = Get-Acl $CredsFile
$acl.SetAccessRuleProtection($true, $false)
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    [System.Security.Principal.WindowsIdentity]::GetCurrent().Name,
    "FullControl", "Allow"
)
$acl.AddAccessRule($rule)
Set-Acl $CredsFile $acl

Ok "Credenziali salvate in $CredsFile"

# ─── 5. Config Claude Desktop ─────────────────────────────────────────────────
Sep
Info "Configurazione Claude Desktop..."

$ClaudeConfig = Join-Path $env:APPDATA "Claude\claude_desktop_config.json"
$ClaudeDir    = Split-Path -Parent $ClaudeConfig

if (-not (Test-Path $ClaudeDir)) {
    New-Item -ItemType Directory -Force -Path $ClaudeDir | Out-Null
}

if (-not (Test-Path $ClaudeConfig)) {
    Set-Content -Path $ClaudeConfig -Value '{"mcpServers":{}}' -Encoding UTF8
    Info "Creato nuovo file di configurazione Claude Desktop."
}

$config = Get-Content $ClaudeConfig -Raw | ConvertFrom-Json

if (-not $config.mcpServers) {
    $config | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue ([PSCustomObject]@{})
}

$serverEntry = [PSCustomObject]@{
    command = "node"
    args    = @("$ScriptDir\build\index.js")
}

$config.mcpServers | Add-Member -NotePropertyName "italia-digitale-mcp" -NotePropertyValue $serverEntry -Force

$config | ConvertTo-Json -Depth 10 | Set-Content -Path $ClaudeConfig -Encoding UTF8

Ok "Server registrato in Claude Desktop."

# ─── 6. Riepilogo ─────────────────────────────────────────────────────────────
Sep
Write-Host ""
Write-Host "  Installazione completata!" -ForegroundColor Green
Write-Host ""
Write-Host "  Prossimo passo: " -NoNewline
Write-Host "riavvia Claude Desktop per attivare il server." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Per verificare, scrivi a Claude:"
Write-Host "  ""Aiuto""  ->  mostra tutti i comandi" -ForegroundColor Cyan
Write-Host "  ""Aggiorna il server MCP""  ->  controlla aggiornamenti" -ForegroundColor Cyan
Write-Host ""
Sep
