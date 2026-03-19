#!/usr/bin/env bash
# =============================================================================
# AstraDup - Auto Build Script
# Installs all dependencies and builds the Electron app for the current platform
# =============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log()    { echo -e "${CYAN}[AstraDup]${RESET} $*"; }
ok()     { echo -e "${GREEN}[  OK  ]${RESET} $*"; }
warn()   { echo -e "${YELLOW}[ WARN ]${RESET} $*"; }
err()    { echo -e "${RED}[ ERR  ]${RESET} $*" >&2; }
header() { echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════${RESET}"; \
           echo -e "${BOLD}${CYAN}  $*${RESET}"; \
           echo -e "${BOLD}${CYAN}═══════════════════════════════════════${RESET}"; }

# ── Parse flags ───────────────────────────────────────────────────────────────
SKIP_TESTS=false
SKIP_TYPE_CHECK=false
TARGET_PLATFORM=""   # auto-detect by default
BUILD_ELECTRON=true

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --skip-tests        Skip running the test suite
  --skip-type-check   Skip TypeScript type checking
  --web-only          Build web assets only (no Electron packaging)
  --platform <os>     Target platform: linux | win | mac  (default: auto-detect)
  -h, --help          Show this help message
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-tests)      SKIP_TESTS=true ;;
    --skip-type-check) SKIP_TYPE_CHECK=true ;;
    --web-only)        BUILD_ELECTRON=false ;;
    --platform)        shift; TARGET_PLATFORM="$1" ;;
    -h|--help)         usage ;;
    *) err "Unknown option: $1"; usage ;;
  esac
  shift
done

# ── Step 1: Verify prerequisites ──────────────────────────────────────────────
header "Step 1/6 · Checking prerequisites"

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    err "'$1' is not installed or not in PATH."
    if [[ -n "${2:-}" ]]; then echo -e "  Install: $2"; fi
    exit 1
  fi
  ok "$1 found: $(command -v "$1")"
}

check_cmd node  "https://nodejs.org (v18+ recommended)"
check_cmd npm   "bundled with Node.js"

NODE_VER=$(node --version | tr -d 'v')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  err "Node.js v18+ is required. Found: v${NODE_VER}"
  exit 1
fi
ok "Node.js version: v${NODE_VER}"

NPM_VER=$(npm --version)
ok "npm version: ${NPM_VER}"

# ── Step 2: Environment setup ─────────────────────────────────────────────────
header "Step 2/6 · Environment setup"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
log "Working directory: $SCRIPT_DIR"

# Copy .env.example → .env if .env is missing
if [[ ! -f ".env" ]]; then
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
    warn ".env not found — copied from .env.example."
    warn "Edit .env and set GEMINI_API_KEY before running AI features."
  else
    warn "No .env file found. AI features require GEMINI_API_KEY."
  fi
else
  ok ".env file present"
fi

# Detect target platform if not specified
if [[ -z "$TARGET_PLATFORM" ]]; then
  case "$(uname -s)" in
    Linux*)  TARGET_PLATFORM="linux" ;;
    Darwin*) TARGET_PLATFORM="mac" ;;
    CYGWIN*|MINGW*|MSYS*) TARGET_PLATFORM="win" ;;
    *) warn "Unrecognised OS — defaulting to linux"; TARGET_PLATFORM="linux" ;;
  esac
fi
ok "Target platform: ${TARGET_PLATFORM}"

# ── Step 3: Install Linux system libraries (if needed) ───────────────────────
if [[ "$TARGET_PLATFORM" == "linux" && "$BUILD_ELECTRON" == "true" ]]; then
  header "Step 3/6 · Linux system libraries"
  if command -v apt-get &>/dev/null; then
    log "Checking GTK/WebKit libraries for Electron…"
    PKGS=()
    dpkg -l libgtk-3-dev   &>/dev/null || PKGS+=(libgtk-3-dev)
    dpkg -l libwebkit2gtk-4.0-dev &>/dev/null || PKGS+=(libwebkit2gtk-4.0-dev)
    dpkg -l libnss3-dev    &>/dev/null || PKGS+=(libnss3-dev)
    if [[ ${#PKGS[@]} -gt 0 ]]; then
      log "Installing: ${PKGS[*]}"
      sudo apt-get update -qq
      sudo apt-get install -y -qq "${PKGS[@]}"
      ok "System libraries installed"
    else
      ok "System libraries already present"
    fi
  else
    warn "apt-get not found — skipping system library check (non-Debian Linux)."
    warn "Ensure GTK 3 and WebKit2GTK dev libraries are installed."
  fi
else
  header "Step 3/6 · Linux system libraries"
  log "Skipped (platform: ${TARGET_PLATFORM})"
fi

# ── Step 4: Install Node dependencies ────────────────────────────────────────
header "Step 4/6 · Installing Node.js dependencies"

if [[ -f "package-lock.json" ]]; then
  log "Running: npm ci  (clean install from lock file)"
  npm ci
else
  log "No package-lock.json found — running: npm install"
  npm install
fi
ok "Node.js dependencies installed"

# ── Step 5: Type-check & tests ────────────────────────────────────────────────
header "Step 5/6 · Quality checks"

if [[ "$SKIP_TYPE_CHECK" == "false" ]]; then
  log "Running TypeScript type check…"
  npm run type-check
  ok "Type check passed"
else
  warn "Type check skipped (--skip-type-check)"
fi

if [[ "$SKIP_TESTS" == "false" ]]; then
  log "Running test suite…"
  npm run test
  ok "Tests passed"
else
  warn "Tests skipped (--skip-tests)"
fi

# ── Step 6: Build ─────────────────────────────────────────────────────────────
header "Step 6/6 · Building"

if [[ "$BUILD_ELECTRON" == "true" ]]; then
  log "Building Electron app for ${TARGET_PLATFORM}…"
  npm run "electron:build:${TARGET_PLATFORM}"
  ok "Electron build complete"
  echo ""
  log "Output artefacts:"
  if [[ -d "release" ]]; then
    find release -maxdepth 2 -type f \( -name "*.exe" -o -name "*.AppImage" \
      -o -name "*.dmg" -o -name "*.deb" -o -name "*.rpm" \) \
      | while read -r f; do echo "  → $f"; done
  fi
else
  log "Building web assets only…"
  npm run build
  ok "Web build complete → dist/"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║   AstraDup build finished!  ✓        ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${RESET}"
echo ""
