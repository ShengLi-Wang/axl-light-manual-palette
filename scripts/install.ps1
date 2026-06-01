<#
  [INPUT]: Uses PowerShell Invoke-WebRequest, an optional user-provided vault path, and Windows profile folders.
  [OUTPUT]: Downloads and verifies main.js, manifest.json, and styles.css into the vault plugin folder.
  [POS]: Windows installer companion to scripts/install.sh, optimized for paste-and-run and prompt-driven installs.
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false, Position = 0)]
  [string]$VaultPath = "",

  [Parameter(Mandatory = $false)]
  [string]$Version = "latest"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Repo = "little-pond/axl-light"
$PluginId = "axl-light"
$Assets = @("main.js", "manifest.json", "styles.css")

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Expand-InstallerPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $Trimmed = $Path.Trim().Trim('"')
  if ($Trimmed -eq "~") {
    return $HOME
  }

  if ($Trimmed.StartsWith("~\")) {
    return Join-Path -Path $HOME -ChildPath $Trimmed.Substring(2)
  }

  return [Environment]::ExpandEnvironmentVariables($Trimmed)
}

function Read-InstallerVaultPath {
  $DefaultVault = Join-Path -Path ([Environment]::GetFolderPath("MyDocuments")) -ChildPath "Obsidian Vault"

  if (-not (Test-Path -LiteralPath $DefaultVault -PathType Container)) {
    return Read-Host "Paste your Obsidian vault folder path"
  }

  $Answer = Read-Host "Obsidian vault path [$DefaultVault]"
  if ([string]::IsNullOrWhiteSpace($Answer)) {
    return $DefaultVault
  }

  return $Answer
}

function Resolve-InstallerVaultPath {
  param(
    [Parameter(Mandatory = $false)]
    [string]$Path
  )

  if ([string]::IsNullOrWhiteSpace($Path)) {
    $Path = Read-InstallerVaultPath
  }

  $Expanded = Expand-InstallerPath $Path
  if (-not (Test-Path -LiteralPath $Expanded -PathType Container)) {
    throw "Vault path does not exist: $Expanded"
  }

  return (Resolve-Path -LiteralPath $Expanded).ProviderPath
}

function Get-ReleaseBaseUrl {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RequestedVersion
  )

  if ($RequestedVersion -eq "latest") {
    return "https://github.com/$Repo/releases/latest/download"
  }

  return "https://github.com/$Repo/releases/download/$RequestedVersion"
}

function Save-ReleaseAsset {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BaseUrl,

    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [string]$TempDir
  )

  $Target = Join-Path -Path $TempDir -ChildPath $Name
  $Url = "$BaseUrl/$Name"
  Write-Host "Downloading $Name..."
  Invoke-WebRequest -Uri $Url -OutFile $Target -UseBasicParsing

  $Item = Get-Item -LiteralPath $Target
  if ($Item.Length -eq 0) {
    throw "Downloaded empty asset: $Name"
  }
}

try {
  $VaultPath = Resolve-InstallerVaultPath $VaultPath
  $PluginRoot = Join-Path -Path $VaultPath -ChildPath ".obsidian\plugins"
  $PluginDir = Join-Path -Path $PluginRoot -ChildPath $PluginId
  $BaseUrl = Get-ReleaseBaseUrl $Version
  $TempDir = Join-Path -Path ([IO.Path]::GetTempPath()) -ChildPath "axl-light-$([Guid]::NewGuid().ToString('N'))"

  New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

  try {
    foreach ($Asset in $Assets) {
      Save-ReleaseAsset -BaseUrl $BaseUrl -Name $Asset -TempDir $TempDir
    }

    New-Item -ItemType Directory -Force -Path $PluginDir | Out-Null

    foreach ($Asset in $Assets) {
      $Source = Join-Path -Path $TempDir -ChildPath $Asset
      $Target = Join-Path -Path $PluginDir -ChildPath $Asset
      Move-Item -LiteralPath $Source -Destination $Target -Force
    }
  } finally {
    Remove-Item -LiteralPath $TempDir -Recurse -Force -ErrorAction SilentlyContinue
  }

  $ClipboardNote = ""
  try {
    Set-Clipboard -Value $PluginDir
    $ClipboardNote = " (copied to clipboard)"
  } catch {
    $ClipboardNote = ""
  }

  Write-Host ""
  Write-Host "Axl Light installed successfully."
  Write-Host ""
  Write-Host "Plugin folder$ClipboardNote:"
  Write-Host "  $PluginDir"
  Write-Host ""
  Write-Host "Next steps:"
  Write-Host "  1. Restart Obsidian."
  Write-Host "  2. Open Settings -> Community plugins."
  Write-Host "  3. Enable Axl Light."
} catch {
  Write-Host ""
  Write-Host "Axl Light install failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host ""
  Write-Host "Tip: In Obsidian, open Settings -> About -> Open vault in system explorer, then copy that folder path."
  exit 1
}
