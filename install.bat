@echo off
:: install.bat - AstraDup Cross-Storage Video De-duplication System setup script for Windows
:: Requires Node.js 20+ installed and available on PATH
:: Usage: install.bat [--skip-env]
setlocal EnableDelayedExpansion

set "SKIP_ENV=0"
set "SCRIPT_NAME=AstraDup Install"

:: Parse arguments
:parse_args
if "%~1"=="" goto :check_node
if /i "%~1"=="--skip-env" (
    set "SKIP_ENV=1"
    shift
    goto :parse_args
)
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="/?" goto :show_help
echo [WARN] Unknown argument: %~1 (ignored)
shift
goto :parse_args

:show_help
echo.
echo Usage: install.bat [--skip-env]
echo.
echo Options:
echo   --skip-env   Skip .env creation (use if key is already configured)
echo   --help       Show this help message
echo.
goto :eof

:: ============================================================
:: 1. Check Node.js is installed
:: ============================================================
:check_node
echo.
echo [INFO] %SCRIPT_NAME%
echo [INFO] ==========================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not on PATH.
    echo [ERROR] Download Node 20+ from https://nodejs.org/
    exit /b 1
)

:: Get Node major version
for /f "tokens=1 delims=." %%V in ('node --version') do (
    set "NODE_FULL=%%V"
)
set "NODE_MAJOR=!NODE_FULL:~1!"

if !NODE_MAJOR! LSS 20 (
    echo [ERROR] Node.js 20 or later is required.
    for /f %%V in ('node --version') do echo [ERROR] Found: %%V
    echo [ERROR] Upgrade at https://nodejs.org/
    exit /b 1
)

for /f %%V in ('node --version') do echo [OK]   Node.js %%V detected

:: ============================================================
:: 2. Check npm is available
:: ============================================================
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available. Reinstall Node.js from https://nodejs.org/
    exit /b 1
)
for /f %%V in ('npm --version') do echo [OK]   npm %%V detected

:: ============================================================
:: 3. Create .env if needed
:: (AstraDup uses .env, not .env.local)
:: ============================================================
if "%SKIP_ENV%"=="1" (
    echo [INFO] Skipping .env setup ^(--skip-env flag set^)
    goto :check_sdk_pin
)

if exist ".env" (
    echo [INFO] .env already exists -- skipping creation
    goto :check_sdk_pin
)

echo [INFO] Creating .env from template...
(
    echo # AstraDup -- local environment configuration
    echo # Get your free Gemini API key at https://aistudio.google.com/app/apikey
    echo #
    echo # IMPORTANT: This project uses @google/genai 0.14.0 ^(older SDK^).
    echo # Do not upgrade to 1.x without updating all call sites in services\.
    echo GEMINI_API_KEY=your_gemini_api_key_here
) > .env

echo [OK]   .env created
echo [WARN] ACTION REQUIRED: Open .env and replace 'your_gemini_api_key_here' with your actual Gemini API key.

:: ============================================================
:: 4. Verify @google/genai is pinned at 0.14.0
:: ============================================================
:check_sdk_pin
echo.
echo [INFO] Checking @google/genai SDK version pin...
findstr /C:"\"@google/genai\": \"0.14.0\"" package.json >nul 2>&1
if errorlevel 1 (
    echo [WARN] @google/genai does not appear to be pinned at 0.14.0 in package.json.
    echo [WARN] AstraDup's service layer targets the 0.14.0 API. Upgrading to 1.x will break AI features.
) else (
    echo [OK]   @google/genai pinned at 0.14.0 -- correct
)

:: ============================================================
:: 5. Install dependencies
:: ============================================================
echo.
echo [INFO] Installing dependencies with 'npm ci'...
echo [INFO] This uses package-lock.json for reproducible installs.
echo.
call npm ci
if errorlevel 1 (
    echo [ERROR] npm ci failed. Check the output above for details.
    exit /b 1
)
echo [OK]   Dependencies installed successfully

:: ============================================================
:: 6. TypeScript type-check
:: ============================================================
echo.
echo [INFO] Running TypeScript type-check (npx tsc --noEmit)...
echo [INFO] Note: AstraDup has no 'lint' script in package.json -- using tsc directly.
call npx tsc --noEmit
if errorlevel 1 (
    echo [WARN] TypeScript type-check reported errors.
    echo [WARN] Review the output above before running the application.
) else (
    echo [OK]   Type-check passed -- no TypeScript errors
)

:: ============================================================
:: 7. Test notice
:: ============================================================
echo.
echo [WARN] No test suite is configured yet for AstraDup.
echo [WARN] To add tests: install vitest + @testing-library/react, then run 'npm test'.
echo [WARN] See docs\GUIDE.md (Testing section) for step-by-step instructions and
echo [WARN] the correct mock pattern for @google/genai 0.14.0.

:: ============================================================
:: 8. Usage instructions
:: ============================================================
echo.
echo ==========================================================
echo   AstraDup -- Setup Complete
echo ==========================================================
echo.
echo   Before starting, ensure .env contains your Gemini API key.
echo.
echo   Available commands:
echo.
echo     npm run dev       Start dev server at http://localhost:3000
echo     npm run build     Production build to dist\
echo     npm run preview   Serve dist\ locally at http://localhost:4173
echo     npx tsc --noEmit  TypeScript type-check (no lint script configured)
echo.
echo   Application pages:
echo.
echo     /               Dashboard -- scan statistics and file type filters
echo     /scan           Scan -- select storage sources and run duplicate detection
echo     /comparison     Comparison -- side-by-side duplicate diff view
echo     /file/:id       File Detail -- per-file metadata and analysis
echo     /video/:id      Video Detail -- video player + AI metadata enrichment
echo     /analyzer       AI Analyzer -- free-form Gemini image/video query
echo     /settings       Settings -- reference databases and preferences
echo.
echo   Documentation:
echo     docs\GUIDE.md                 Full usage and developer guide
echo     docs\PRODUCTION_CHECKLIST.md  Pre-deployment verification checklist
echo.
echo ==========================================================
echo.

endlocal
