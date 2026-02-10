# Code Review: AstraDup

**Reviewer:** Claude (automated)
**Date:** 2026-02-09
**Scope:** Full codebase review — architecture, correctness, security, maintainability, and best practices

---

## Summary

AstraDup is a well-structured React/TypeScript frontend for AI-powered media de-duplication. The UI is polished with a cohesive design system, and the Gemini AI integration is thoughtfully implemented. However, there are several issues ranging from **critical security concerns** to code quality improvements that should be addressed before production use.

**Severity Legend:**
- CRITICAL — Security risk or data loss potential
- HIGH — Bug or significant architectural issue
- MEDIUM — Code quality or maintainability concern
- LOW — Minor improvement or nitpick

---

## CRITICAL Issues

### 1. API Key Exposed in Client Bundle
**File:** `services/gemini.ts:4`, `vite.config.ts:14-15`

The Gemini API key is injected directly into the client-side JavaScript bundle via Vite's `define` config:
```ts
// vite.config.ts
'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
```
```ts
// gemini.ts
const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY! });
```

**Impact:** Anyone can open browser DevTools and extract the API key. This allows unauthorized usage billed to your account.

**Recommendation:** Proxy all Gemini API calls through a backend server. The API key should never leave the server. At minimum, use Gemini API key restrictions (HTTP referrer, IP allowlisting) as a stopgap.

---

### 2. Invalid Package Name
**File:** `package.json:2`

```json
"name": "astradup:-cross-storage-ai-video-de-duplication-system"
```

The colon (`:`) is not a valid character in npm package names. This will cause `npm publish` to fail and may cause issues with some tooling.

**Fix:** Rename to `astradup-cross-storage-video-deduplication` or similar.

---

## HIGH Issues

### 3. Memory Leak in Video Player Event Listeners
**File:** `pages/FileDetail.tsx:207-217`

```ts
video.addEventListener('ended', () => setIsPlaying(false));
// ...
video.removeEventListener('ended', () => setIsPlaying(false)); // Different reference!
```

The `removeEventListener` call uses a new anonymous function, which is a **different reference** from the one passed to `addEventListener`. The listener is never actually removed, causing a memory leak on every component remount.

**Fix:** Extract the handler to a named function or `useCallback`:
```ts
const handleEnded = () => setIsPlaying(false);
video.addEventListener('ended', handleEnded);
return () => video.removeEventListener('ended', handleEnded);
```

---

### 4. Dead File — `pages/VideoDetail.tsx`
**File:** `pages/VideoDetail.tsx`

This file exists but is empty (only whitespace). It's not imported anywhere. The actual video detail logic lives inside `pages/FileDetail.tsx` as `VideoDetailContent`.

**Fix:** Delete `pages/VideoDetail.tsx`.

---

### 5. Duplicated `extractFrames` Function
**Files:** `pages/ComparisonPage.tsx:109-146`, `pages/AnalyzerPage.tsx:138-179`

The frame extraction logic is duplicated across two files with minor differences (3 timestamps vs 5 timestamps). This violates DRY and makes bug fixes error-prone.

**Recommendation:** Extract to a shared utility, e.g. `services/videoUtils.ts`:
```ts
export const extractFrames = (video: HTMLVideoElement, canvas: HTMLCanvasElement, count: number): Promise<Frame[]>
```

---

### 6. Duplicated Component Definitions
**Files:** `pages/FileDetail.tsx` and `pages/ComparisonPage.tsx`

Both files define their own `DetailItem` and `AnalysisItem` components with slight differences (e.g., `highlight` prop in ComparisonPage). This increases maintenance burden.

**Recommendation:** Consolidate into shared components under `components/` with optional props for variant behavior.

---

### 7. Both Action Buttons Perform the Same Operation
**File:** `pages/ComparisonPage.tsx:33-46`

```tsx
const ActionPanel = ({ fileToKeep, fileToDelete, onDelete }) => (
    <Button onClick={() => onDelete(fileToDelete)}>Keep This</Button>
    <Button onClick={() => onDelete(fileToDelete)}>Delete Other</Button>
);
```

Both "Keep This" and "Delete Other" call `onDelete(fileToDelete)` — they are functionally identical. The "Keep This" button should presumably have different behavior (e.g., marking the file as the canonical copy).

---

### 8. `@google/genai` Pinned to `"latest"`
**File:** `package.json:12`

```json
"@google/genai": "latest"
```

Using `"latest"` means every `npm install` can pull a different version, leading to non-reproducible builds and potential breaking changes.

**Fix:** Pin to a specific version (e.g., `"^1.0.0"`).

---

## MEDIUM Issues

### 9. No Error Boundaries
**All page components**

There are no React Error Boundaries in the app. An unhandled error in any component will crash the entire application with a blank screen.

**Recommendation:** Add an `ErrorBoundary` wrapper around `<Outlet />` in `Layout.tsx`.

---

### 10. `alert()` Used for User Notifications
**Files:** `components/DuplicateResultDisplay.tsx:83,90`, `pages/ComparisonPage.tsx:395`, `pages/ScanPage.tsx:177`

Using `window.alert()` blocks the UI thread and provides a poor user experience.

**Recommendation:** Implement a toast/notification system using a state-based approach or a library.

---

### 11. Settings State Not Persisted
**File:** `pages/Settings.tsx`

All settings (similarity threshold, modality count, databases, etc.) are local React state that resets on every page navigation. The "Save Changes" and "Reset to Defaults" buttons have no handlers — they're no-ops.

**Impact:** Users' settings changes are silently lost.

**Recommendation:** At minimum, implement `localStorage` persistence. Ideally, lift settings into a React Context shared across the app.

---

### 12. Dashboard Uses Hardcoded Multipliers for Filtering
**File:** `pages/Dashboard.tsx:59-72`

```ts
if (filter === 'video') return [
    { title: "Videos Scanned", value: (stats.filesScanned * 0.4)... },
    { title: "Video Storage Saved", value: (stats.storageSavedTB * 0.7)... },
];
```

The per-type stats are fabricated by multiplying the total by magic numbers (0.4, 0.5, 0.1, 0.7, etc.) rather than coming from real per-type data. This produces misleading statistics.

**Recommendation:** Either return per-type stats from the API/data layer, or clearly mark these as approximate in the UI.

---

### 13. Inconsistent Route Path Patterns
**File:** `App.tsx:22`

```tsx
<Route path="scan" element={<ScanPage />} />        // relative
<Route path="/compare/:fileId1/:fileId2" ... />      // absolute with leading /
```

Mixing relative and absolute paths inside nested routes is error-prone. Under a `<Route path="/">` parent, both work, but the inconsistency makes the code harder to maintain.

**Fix:** Use relative paths consistently: `compare/:fileId1/:fileId2`.

---

### 14. No `.env.local.example` File
**Project root**

The README references `cp .env.local.example .env.local`, but this file doesn't exist. New developers won't know which env vars are needed.

**Fix:** Create `.env.local.example` with:
```
GEMINI_API_KEY=your_key_here
```

---

### 15. `console.log` Statements in Production Code
**Files:** `pages/ScanPage.tsx:161`, `pages/ComparisonPage.tsx:83,202,394`, `components/DuplicateResultDisplay.tsx:80,88`

Multiple `console.log` calls output debug information. These should be removed or gated behind a debug flag.

---

### 16. No Lock File Committed
**Project root**

No `package-lock.json` or other lock file exists. This means different developers may get different dependency versions.

**Fix:** Run `npm install` and commit the resulting `package-lock.json`.

---

### 17. Missing `strict` and `noUncheckedIndexedAccess` in TypeScript Config
**File:** `tsconfig.json`

The TypeScript config lacks `strict: true`, which means null checks, implicit any, and other safety checks are not enforced.

**Recommendation:** Enable `"strict": true` and `"noUncheckedIndexedAccess": true` for stronger type safety.

---

## LOW Issues

### 18. Tailwind CSS Loaded via CDN
**File:** `index.html:8`

```html
<script src="https://cdn.tailwindcss.com"></script>
```

The Tailwind CDN build includes the entire framework (~300KB+), doesn't support tree-shaking, and is [not recommended for production](https://tailwindcss.com/docs/installation). It also requires an internet connection.

**Recommendation:** Install Tailwind as a PostCSS plugin for production builds.

---

### 19. Unused `React` Imports
**Multiple files**

With the JSX transform (`"jsx": "react-jsx"` in tsconfig), explicit `import React from 'react'` is no longer required. Most files still include it unnecessarily.

**Impact:** Minor — adds import noise. Not functionally broken.

---

### 20. No Test Infrastructure
**Project root**

No test framework, test files, or test scripts are present. For a project with this much interactive logic (scan wizards, state machines, comparison views), tests are important for preventing regressions.

**Recommendation:** Add Vitest (pairs well with Vite) and React Testing Library. Priority test targets:
- `services/api.ts` — data layer
- `DuplicateResultDisplay` — bulk selection logic
- `ScanPage` — multi-step wizard state machine

---

### 21. No CI/CD Pipeline
**Project root**

No GitHub Actions or other CI config exists. Adding basic CI for type-checking and linting would prevent regressions.

**Recommended workflow:**
```yaml
# .github/workflows/ci.yml
- npm ci
- npx tsc --noEmit
- npm run build
```

---

### 22. `type: any` Usage
**Files:** `components/Layout.tsx:7`, `pages/AnalyzerPage.tsx:294`, `services/gemini.ts` (implicit via SDK)

Several components use `React.FC<any>` for icon props or use `any` for Gemini response types. This defeats TypeScript's purpose.

**Fix:** Use proper types like `React.FC<React.SVGProps<SVGSVGElement>>` consistently.

---

### 23. Object URL Memory Leak in AnalyzerPage
**File:** `pages/AnalyzerPage.tsx:107`

```tsx
<img src={URL.createObjectURL(file)} ... />
```

`URL.createObjectURL()` allocates a blob URL that persists until the page is unloaded or explicitly revoked. Re-rendering creates new URLs without revoking old ones.

**Fix:** Store the URL in state and call `URL.revokeObjectURL()` on cleanup:
```ts
useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
}, [file]);
```

---

### 24. `w-0` on Main Content Container
**File:** `components/Layout.tsx:94`

```tsx
<div className="flex flex-col flex-1 w-0">
```

`w-0` forces zero width and relies on `flex-1` to expand. While this works in most browsers, it can cause rendering issues in older browsers or SSR contexts. Using `min-w-0` is the more standard Flexbox approach.

---

## Positive Observations

- **Cohesive design system** — Consistent use of green/black theme with glow effects
- **Well-typed data models** — `types.ts` has thorough interfaces with discriminated unions
- **Multi-modality analysis architecture** — The `AnalysisModality<T>` generic with confidence scores is well-designed
- **Responsive layout** — Mobile sidebar, collapsible nav, and grid breakpoints are well-implemented
- **Clean component decomposition** — Good separation of pages, components, and services
- **Gemini integration** — Clean service layer with proper separation of concerns for different AI capabilities

---

## Priority Recommendations

1. **Immediately** fix the API key exposure (Critical #1)
2. **Before merge** fix the memory leak (#3), invalid package name (#2), and pin dependencies (#8)
3. **Short-term** consolidate duplicated code (#5, #6), add error boundaries (#9), and persist settings (#11)
4. **Medium-term** add tests (#20), CI (#21), and proper Tailwind build (#18)
