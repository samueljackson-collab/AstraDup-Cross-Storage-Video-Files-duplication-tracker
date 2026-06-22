#Requires -Version 5.1
<#
.SYNOPSIS
    AstraDup — Cross-Storage AI Video De-duplication System, Windows PowerShell install script.

.DESCRIPTION
    Checks Node.js 20+, verifies the @google/genai 0.14.0 SDK pin, creates .env if absent,
    installs npm dependencies with 'npm ci', runs the TypeScript type-check, and prints usage.

.PARAMETER SkipEnv
    Skip creation of .env (use when the file already exists or the API key is
    injected via another mechanism such as a CI secret).

.EXAMPLE
    .\install.ps1
    .\install.ps1 -SkipEnv
#>

[CmdletBinding()]
param(
    [switch]$SkipEnv
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

###############################################################################
# Helpers
###############################################################################

function Write-Info  { param([string]$Msg) Write-Host "[INFO]  $Msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$Msg) Write-Host "[OK]    $Msg" -ForegroundColor Green }
function Write-Warn  { param([string]$Msg) Write-Host "[WARN]  $Msg" -ForegroundColor Yellow }
function Write-Err   { param([string]$Msg) Write-Host "[ERROR] $Msg" -ForegroundColor Red }

###############################################################################
# 1. Node.js version check
###############################################################################

function Assert-NodeVersion {
    Write-Info "Checking Node.js installation..."

    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Err "Node.js is not installed or not on PATH."
        Write-Err "Download Node 20+ from https://nodejs.org/"
        exit 1
    }

    $nodeVersion = (node --version).TrimStart('v')
    $nodeMajor   = [int]($nodeVersion.Split('.')[0])

    if ($nodeMajor -lt 20) {
        Write-Err "Node.js 20 or later is required. Found: v$nodeVersion"
        Write-Err "Upgrade at https://nodejs.org/"
        exit 1
    }

    Write-Ok "Node.js v$nodeVersion detected"
}

###############################################################################
# 2. npm check
###############################################################################

function Assert-NpmAvailable {
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npmCmd) {
        Write-Err "npm is not available. Reinstall Node.js from https://nodejs.org/"
        exit 1
    }

    $npmVersion = npm --version
    Write-Ok "npm $npmVersion detected"
}

###############################################################################
# 3. Create .env (AstraDup uses .env, not .env.local)
###############################################################################

function Initialize-EnvFile {
    if ($SkipEnv) {
        Write-Info "Skipping .env setup (-SkipEnv flag set)"
        return
    }

    if (Test-Path ".env") {
        Write-Info ".env already exists -- skipping creation"
        return
    }

    Write-Info "Creating .env from template..."

    $content = @"
# AstraDup -- local environment configuration
# Get your free Gemini API key at https://aistudio.google.com/app/apikey
#
# IMPORTANT: This project uses @google/genai 0.14.0 (older SDK).
# Do not upgrade to 1.x without updating all call sites in services/.
GEMINI_API_KEY=your_gemini_api_key_here
"@

    Set-Content -Path ".env" -Value $content -Encoding UTF8
    Write-Ok ".env created"
    Write-Warn "ACTION REQUIRED: Open .env and replace 'your_gemini_api_key_here' with your actual Gemini API key."
}

###############################################################################
# 4. Verify @google/genai SDK is pinned at 0.14.0
###############################################################################

function Assert-SdkPin {
    Write-Info "Checking @google/genai SDK version pin..."

    if (-not (Test-Path "package.json")) {
        Write-Warn "package.json not found -- skipping SDK version check"
        return
    }

    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $sdkVersion  = $packageJson.dependencies."@google/genai"

    if ($sdkVersion -ne "0.14.0") {
        Write-Warn "@google/genai version is '$sdkVersion', expected '0.14.0'."
        Write-Warn "AstraDup's service layer targets the 0.14.0 API."
        Write-Warn "Upgrading to 1.x will break AI features without code changes in services/."
    } else {
        Write-Ok "@google/genai pinned at 0.14.0 -- correct"
    }
}

###############################################################################
# 5. Install dependencies
###############################################################################

function Install-Dependencies {
    Write-Info "Installing dependencies with 'npm ci'..."
    Write-Info "(Uses package-lock.json for reproducible installs)"

    & npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm ci failed. Review the output above."
        exit $LASTEXITCODE
    }

    Write-Ok "Dependencies installed successfully"
}

###############################################################################
# 6. TypeScript type-check
###############################################################################

function Invoke-TypeCheck {
    Write-Info "Running TypeScript type-check (npx tsc --noEmit)..."
    Write-Info "Note: AstraDup has no 'lint' script in package.json -- using tsc directly."

    & npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "TypeScript type-check reported errors. Review the output above before running the application."
    } else {
        Write-Ok "Type-check passed -- no TypeScript errors"
    }
}

###############################################################################
# 7. Test notice
###############################################################################

function Show-TestNotice {
    Write-Warn "No test suite is configured yet for AstraDup."
    Write-Warn "To add tests: install vitest + @testing-library/react, then run 'npm test'."
    Write-Warn "See docs\GUIDE.md (Testing section) for step-by-step instructions and"
    Write-Warn "the correct mock pattern for @google/genai 0.14.0."
}

###############################################################################
# 8. Usage summary
###############################################################################

function Show-Usage {
    $divider = "=" * 58

    Write-Host ""
    Write-Host $divider -ForegroundColor Cyan
    Write-Host "  AstraDup -- Setup Complete" -ForegroundColor Cyan
    Write-Host $divider -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Before starting, ensure .env contains your Gemini API key."
    Write-Host ""
    Write-Host "  Available commands:" -ForegroundColor White
    Write-Host ""
    Write-Host "    npm run dev       Start dev server at http://localhost:3000" -ForegroundColor Gray
    Write-Host "    npm run build     Production build to dist\" -ForegroundColor Gray
    Write-Host "    npm run preview   Serve dist\ locally at http://localhost:4173" -ForegroundColor Gray
    Write-Host "    npx tsc --noEmit  TypeScript type-check (no lint script configured)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Application pages:" -ForegroundColor White
    Write-Host ""
    Write-Host "    /               Dashboard -- scan statistics and file type filters" -ForegroundColor Gray
    Write-Host "    /scan           Scan -- select sources and run duplicate detection" -ForegroundColor Gray
    Write-Host "    /comparison     Comparison -- side-by-side duplicate diff view" -ForegroundColor Gray
    Write-Host "    /file/:id       File Detail -- per-file metadata and analysis" -ForegroundColor Gray
    Write-Host "    /video/:id      Video Detail -- video player + AI metadata enrichment" -ForegroundColor Gray
    Write-Host "    /analyzer       AI Analyzer -- free-form Gemini image/video query" -ForegroundColor Gray
    Write-Host "    /settings       Settings -- reference databases and preferences" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Documentation:" -ForegroundColor White
    Write-Host ""
    Write-Host "    docs\GUIDE.md                 Full usage and developer guide" -ForegroundColor Gray
    Write-Host "    docs\PRODUCTION_CHECKLIST.md  Pre-deployment verification checklist" -ForegroundColor Gray
    Write-Host ""
    Write-Host $divider -ForegroundColor Cyan
    Write-Host ""
}

###############################################################################
# Main
###############################################################################

Write-Host ""
Write-Info "AstraDup -- Install Script"
Write-Info "==========================="
Write-Host ""

Assert-NodeVersion
Assert-NpmAvailable
Initialize-EnvFile
Assert-SdkPin
Install-Dependencies
Invoke-TypeCheck
Show-TestNotice
Show-Usage
