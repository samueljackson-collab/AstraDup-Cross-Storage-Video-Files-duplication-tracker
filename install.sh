#!/usr/bin/env sh
# install.sh — AstraDup Cross-Storage Video De-duplication System setup script
# POSIX-compatible (sh, bash, dash, zsh)
# Usage: sh install.sh [--skip-env]

set -e

###############################################################################
# Helpers
###############################################################################

info()  { printf '\033[0;34m[INFO]\033[0m  %s\n' "$*"; }
ok()    { printf '\033[0;32m[OK]\033[0m    %s\n' "$*"; }
warn()  { printf '\033[0;33m[WARN]\033[0m  %s\n' "$*"; }
error() { printf '\033[0;31m[ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

###############################################################################
# Parse arguments
###############################################################################

SKIP_ENV=0
for arg in "$@"; do
  case "$arg" in
    --skip-env) SKIP_ENV=1 ;;
    --help|-h)
      printf 'Usage: sh install.sh [--skip-env]\n\n'
      printf 'Options:\n'
      printf '  --skip-env   Skip .env creation (use if key is already configured)\n'
      printf '  --help       Show this help message\n'
      exit 0
      ;;
    *)
      warn "Unknown argument: $arg (ignored)"
      ;;
  esac
done

###############################################################################
# 1. Node.js version check (requires Node 20+)
###############################################################################

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    error "Node.js is not installed. Download Node 20+ from https://nodejs.org/"
  fi

  NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)

  if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js 20 or later is required. Found: $(node --version). Upgrade at https://nodejs.org/"
  fi

  ok "Node.js $(node --version) detected"
}

###############################################################################
# 2. npm availability check
###############################################################################

check_npm() {
  if ! command -v npm >/dev/null 2>&1; then
    error "npm is not available. It should be bundled with Node.js — try reinstalling Node."
  fi
  ok "npm $(npm --version) detected"
}

###############################################################################
# 3. .env setup (AstraDup uses .env, not .env.local)
###############################################################################

setup_env() {
  if [ "$SKIP_ENV" -eq 1 ]; then
    info "Skipping .env setup (--skip-env flag set)"
    return
  fi

  if [ -f ".env" ]; then
    info ".env already exists — skipping creation"
    return
  fi

  info "Creating .env from template..."
  cat > .env << 'EOF'
# AstraDup -- local environment configuration
# Get your free Gemini API key at https://aistudio.google.com/app/apikey
#
# IMPORTANT: This project uses @google/genai 0.14.0 (older SDK).
# Do not upgrade to 1.x without updating all call sites in services/.
GEMINI_API_KEY=your_gemini_api_key_here
EOF

  ok ".env created"
  warn "ACTION REQUIRED: Open .env and replace 'your_gemini_api_key_here' with your actual Gemini API key."
}

###############################################################################
# 4. Pin check: verify @google/genai version is 0.14.0
###############################################################################

check_sdk_pin() {
  if [ -f "package.json" ]; then
    # Extract the pinned version from package.json
    SDK_VERSION=$(grep '"@google/genai"' package.json | sed 's/.*: *"//' | sed 's/".*//')
    if [ "$SDK_VERSION" != "0.14.0" ]; then
      warn "@google/genai version in package.json is '$SDK_VERSION', expected '0.14.0'."
      warn "AstraDup's service layer is written for the 0.14.0 API. Upgrading to 1.x will break AI features."
    else
      ok "@google/genai pinned at 0.14.0 — correct"
    fi
  fi
}

###############################################################################
# 5. Install dependencies
###############################################################################

install_deps() {
  info "Installing dependencies with 'npm ci' (uses package-lock.json for reproducible installs)..."
  npm ci
  ok "Dependencies installed successfully"
}

###############################################################################
# 6. TypeScript type-check
###############################################################################

run_typecheck() {
  info "Running TypeScript type-check (npx tsc --noEmit)..."
  info "Note: AstraDup has no 'lint' script in package.json — using tsc directly."
  if npx tsc --noEmit; then
    ok "Type-check passed — no TypeScript errors"
  else
    warn "TypeScript type-check reported errors. Review the output above before running the application."
  fi
}

###############################################################################
# 7. Test notice
###############################################################################

test_notice() {
  warn "No test suite is configured yet for AstraDup."
  warn "To add tests: install vitest + @testing-library/react, then run 'npm test'."
  warn "See docs/GUIDE.md (Testing section) for step-by-step instructions and"
  warn "the correct mock pattern for @google/genai 0.14.0."
}

###############################################################################
# 8. Usage instructions
###############################################################################

print_usage() {
  printf '\n'
  printf '==========================================================\n'
  printf '  AstraDup -- Setup Complete\n'
  printf '==========================================================\n'
  printf '\n'
  printf '  Before starting, ensure .env contains your Gemini API key.\n'
  printf '\n'
  printf '  Available commands:\n'
  printf '\n'
  printf '    npm run dev       Start development server at http://localhost:3000\n'
  printf '    npm run build     Production build to dist/\n'
  printf '    npm run preview   Serve dist/ locally at http://localhost:4173\n'
  printf '    npx tsc --noEmit  TypeScript type-check (no lint script configured)\n'
  printf '\n'
  printf '  Application pages:\n'
  printf '\n'
  printf '    /               Dashboard — scan statistics and file type filters\n'
  printf '    /scan           Scan — select storage sources and run duplicate detection\n'
  printf '    /comparison     Comparison — side-by-side duplicate diff view\n'
  printf '    /file/:id       File Detail — per-file metadata and analysis\n'
  printf '    /video/:id      Video Detail — video player + AI metadata enrichment\n'
  printf '    /analyzer       AI Analyzer — free-form Gemini image/video query\n'
  printf '    /settings       Settings — reference databases and preferences\n'
  printf '\n'
  printf '  Documentation:\n'
  printf '    docs/GUIDE.md               Full usage and developer guide\n'
  printf '    docs/PRODUCTION_CHECKLIST.md  Pre-deployment verification checklist\n'
  printf '\n'
  printf '==========================================================\n'
  printf '\n'
}

###############################################################################
# Main
###############################################################################

info "AstraDup — Install Script"
info "========================="

check_node
check_npm
setup_env
check_sdk_pin
install_deps
run_typecheck
test_notice
print_usage
