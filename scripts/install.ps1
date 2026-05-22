<#
  [INPUT]: Uses PowerShell Invoke-WebRequest and a user-provided Obsidian vault path.
  [OUTPUT]: Downloads main.js, manifest.json, and styles.css into the vault plugin folder.
  [POS]: Windows installer companion to scripts/install.sh for Axl Light release assets.
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
#>

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$VaultPath,

  [Parameter(Mandatory = $false)]
  [string]$Version = "latest"
)

$ErrorActionPreference = "Stop"

$Repo = "little-pond/axl-light"
$PluginId = "axl-light"

if (-not (Test-Path -LiteralPath $VaultPath -PathType Container)) {
  throw "Vault path does not exist: $VaultPath"
}

$PluginDir = Join-Path -Path $VaultPath -ChildPath ".obsidian\plugins\$PluginId"
New-Item -ItemType Directory -Force -Path $PluginDir | Out-Null

if ($Version -eq "latest") {
  $BaseUrl = "https://github.com/$Repo/releases/latest/download"
} else {
  $BaseUrl = "https://github.com/$Repo/releases/download/$Version"
}

function Download-Asset {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $Target = Join-Path -Path $PluginDir -ChildPath $Name
  $Url = "$BaseUrl/$Name"
  Write-Host "Downloading $Name..."
  Invoke-WebRequest -Uri $Url -OutFile $Target -UseBasicParsing
}

Download-Asset "main.js"
Download-Asset "manifest.json"
Download-Asset "styles.css"

Write-Host ""
Write-Host "Axl Light installed successfully."
Write-Host ""
Write-Host "Plugin folder:"
Write-Host "  $PluginDir"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart Obsidian."
Write-Host "  2. Open Settings -> Community plugins."
Write-Host "  3. Enable Axl Light."
