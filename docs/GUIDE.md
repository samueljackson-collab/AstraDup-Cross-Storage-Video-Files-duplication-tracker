# AstraDup — Cross-Storage AI Video De-duplication System: Developer & User Guide

## Overview

AstraDup is an AI-powered media de-duplication system that detects true duplicate files across heterogeneous storage locations — local drives, NAS devices, and cloud storage buckets (S3, GCS, Azure Blob, Google Drive, OneDrive, Dropbox). It runs entirely in the browser as a React 19 + TypeScript SPA built with Vite. There is no backend; all state is held in `localStorage` and in-memory.

**Core capabilities:**

- **Multi-modal duplicate detection** — combines perceptual hashing (pHash, dHash), audio fingerprinting, and scene/semantic embeddings to identify true duplicates beyond simple byte-for-byte comparison
- **AI metadata enrichment** — queries Google Gemini to fetch rich metadata (titles, plots, actors, genre) for video files
- **Document summarisation** — uses Gemini to generate concise summaries of text documents
- **AI Analyzer** — a free-form query interface where users can upload image frames or video stills and ask Gemini questions about the content, with optional web-grounded answers
- **Comparison view** — a side-by-side panel showing two candidate duplicates with pixel-level diffs for images, text diffs for documents, and a full-featured video player for video files
- **Dashboard** — aggregate statistics across scanned storage sources with breakdowns by file type

The application uses `@google/genai` version **0.14.0** — this is an older release of the SDK. If you search for code examples online, be aware that the API surface of 0.14.0 differs from the 1.x releases (see the SDK Compatibility note in the Usage section below).

---

## Prerequisites

- **Node.js 20 or later** — download from <https://nodejs.org/>
- **npm 10 or later** (bundled with Node 20)
- **A Google Gemini API key** — obtain one free at <https://aistudio.google.com/app/apikey>
- A modern browser with HTML5 video support (Chrome 120+, Firefox 120+, Edge 120+)
- Sufficient available codec support for your test video files (H.264 is universally supported; see Troubleshooting for HEVC/AV1 notes)

Verify your Node version:

```bash
node --version   # must print v20.x.x or higher
npm --version
```

---

## Installation

```bash
# 1. Clone or download the repository
git clone <repo-url> AstraDup
cd AstraDup

# 2. Install dependencies (uses the exact locked versions from package-lock.json)
npm ci

# 3. Configure your Gemini API key (see next section)

# 4. Start the development server
npm run dev
```

The dev server starts at **http://localhost:3000**.

---

## Gemini API Key Setup

The application reads the API key from the `GEMINI_API_KEY` environment variable at **Vite build time**. Vite injects it as `process.env.GEMINI_API_KEY` into the compiled bundle.

### Local development

Create a `.env` file in the project root (keep it out of version control):

```
GEMINI_API_KEY=your_actual_api_key_here
```

Then (re)start `npm run dev`. Vite reads the `.env` file automatically via `loadEnv`.

### CI / production builds

Set `GEMINI_API_KEY` as a CI secret before running `npm run build`. The key is embedded in the compiled JavaScript — do not commit it or expose the built bundle to untrusted audiences without a proxy.

> **Security note:** This is a purely client-side application, so the API key is visible in the built JavaScript. For production deployments with untrusted users, route Gemini calls through a backend proxy that holds the key server-side.

---

## Usage

### SDK Compatibility Note: @google/genai 0.14.0

AstraDup pins `@google/genai` at exactly **0.14.0**. This is an older release and its API differs from the 1.x line in important ways:

| Area | 0.14.0 (this project) | 1.x (newer) |
|------|----------------------|-------------|
| Client init | `new GoogleGenerativeAI(apiKey)` | `new GoogleGenAI({ apiKey })` |
| Model access | `.getGenerativeModel({ model })` | `.models.generateContent(...)` |
| Content generation | `.generateContent(prompt)` | same method, different client |
| File uploads | not available | `client.files.upload(...)` |

If you extend the AI service layer (`services/`) and find example code online, ensure the examples target the 0.14.0 API or adapt them accordingly. Do not upgrade to 1.x without auditing every call site in `services/`.

### Dashboard

The Dashboard page (`/`) shows aggregate statistics from the most recent scan:

- Total files scanned, broken down by type (video / image / document)
- Number of duplicate pairs found per file type
- Estimated storage savings in TB
- Interactive filter buttons to focus the view on a single file type

### Scanning Storage Locations

Navigate to the **Scan** page. Select one or more storage sources from the source picker (Local Drive, NAS, S3, GCS, etc.). Choose the file type to scan (Video, Image, Document) and click **Start Scan**.

The scan engine runs in the browser and uses mock data from the API service layer (`services/`). For local file system access, the browser's File System Access API is used where available. Each file is analysed with:

1. **pHash / dHash** — fast perceptual hash comparison for visual similarity
2. **Audio fingerprint** — Chromaprint-style frequency analysis for video/audio files
3. **Scene embeddings** — cosine similarity on scene-level feature vectors
4. **Face clustering** — groups faces across files to find re-encoded duplicates

Results appear in the Scan Results list, grouped by similarity score.

### Viewing Duplicates

The Scan Results list shows duplicate pairs with:
- Both file thumbnails
- Similarity score (0–100%)
- Matched modalities (which analysis methods agreed)
- File sizes, paths, and source locations

Bulk actions: **Delete Selected** removes the lower-quality duplicate; **Mark as Not Duplicate** dismisses a pair from future results.

### Comparison View (Side-by-Side Diff)

Click **Compare** on any duplicate pair to open the Comparison page. Two panels render the files simultaneously:

- **Video files** — a custom video player with play/pause (`Space`), seek (arrow keys), volume (`Up`/`Down`), mute (`M`), and fullscreen (`F`) keyboard shortcuts
- **Image files** — pixel-level difference overlay highlighting changed regions
- **Documents** — line-by-line text diff with added/removed/unchanged markers

The comparison page also shows a full metadata table for each file (codec, resolution, bitrate, frame rate, EXIF data, word counts, etc.).

### Video Detail & AI Metadata Enrichment

Click any video file to open the **Video Detail** page. From here you can:

- Play the video using the built-in player
- Trigger **AI Metadata Enrichment** — sends the file name to Gemini and populates title, plot, actors, and genre fields using web-grounded search
- View the enriched data alongside the raw technical metadata

Metadata is persisted in `localStorage` so repeated lookups do not consume API quota.

### File Detail

The **File Detail** page works for all file types. It shows the full analysis breakdown (confidence scores for each modality), comparison history (which other files this file has been compared against), and enriched metadata if available.

### AI Analyzer

The **Analyzer** page is a free-form Gemini query interface:

1. Upload one or more images or video frame captures using the file picker
2. Type a text prompt (e.g., "What objects are visible in this frame?" or "Is this the same scene as the second image?")
3. Click **Analyze** — the request is sent to Gemini via the 0.14.0 SDK
4. Results appear below, including any web-grounded source citations if the model uses search

> **SDK note for Analyzer:** The 0.14.0 SDK does not support the `files.upload()` method available in 1.x. Image data is base64-encoded inline in the request payload, which limits practical file sizes to a few MB per request.

### Settings

The **Settings** page allows configuration of:

- Reference databases (known-good file sets to exclude from duplicate results)
- Default scan preferences
- localStorage management (clear stored data, export settings)

Settings are persisted under a dedicated `localStorage` key.

---

## Testing

AstraDup does not currently have a test suite. The following steps set up Vitest and enable writing and running tests.

### Adding Vitest

```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Add a `vitest.config.ts` at the project root:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

Add test scripts to `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### SDK-specific Mocking for 0.14.0

When writing tests for code that calls `@google/genai`, mock the **0.14.0 API** — not the 1.x API. The 0.14.0 client shape is:

```typescript
// vi.mock for @google/genai 0.14.0
vi.mock('@google/genai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'mocked response text',
          candidates: [],
        },
      }),
    }),
  })),
}));
```

Do not use mocks written for `@google/genai` 1.x (which use `new GoogleGenAI(...)`) — they will silently fail against the 0.14.0 import.

### Running Tests Once Added

```bash
npm test              # run all tests once
npm run test:watch    # interactive watch mode
npm run test:coverage # generate coverage report in coverage/
```

### Suggested First Test Targets

1. `utils/` — video frame extraction utilities; mock the Canvas API and `HTMLVideoElement`
2. `services/` — Gemini service layer; mock `@google/genai` 0.14.0 as shown above
3. `pages/Dashboard.tsx` — render with mock stats and verify stat cards display correctly
4. Duplicate pair detection logic — feed known fixture data and assert correct similarity scores

---

## Production Build

AstraDup does not have a lint script configured. Run the TypeScript compiler directly to check for type errors before building:

```bash
npx tsc --noEmit     # TypeScript type-check (no lint script in package.json)
npm run build        # compiles to dist/
npm run preview      # serve dist/ locally at http://localhost:4173
```

Deploy the contents of `dist/` to a static host. No server runtime is required.

---

## Troubleshooting

### Video player does not load or shows a black screen

The built-in video player is an HTML5 `<video>` element. Playback requires the browser to support the video's codec.

1. **H.264 (MP4)** — supported in all major browsers; this is the safest format
2. **HEVC/H.265** — not supported in Firefox by default; Chrome on Windows supports it via system codecs; macOS supports it natively
3. **AV1** — supported in Chrome 70+ and Firefox 67+; not supported in older Safari
4. **VP9 (WebM)** — supported in Chrome and Firefox; limited Safari support

If a video fails to play, check the browser console for `MEDIA_ERR_SRC_NOT_SUPPORTED`. Try converting the file to H.264 MP4 using FFmpeg: `ffmpeg -i input.mkv -c:v libx264 -c:a aac output.mp4`

### Gemini AI Analyzer returns an error or no response

1. Confirm `GEMINI_API_KEY` is set in `.env` and the dev server was restarted after the file was created.
2. Open the browser console (`F12 > Console`) and look for HTTP error codes:
   - `400 Bad Request` — the request payload may be malformed; check image base64 encoding
   - `403 Forbidden` — the API key is invalid or the Generative Language API is not enabled for your project
   - `429 Too Many Requests` — free tier quota exhausted; wait or upgrade your plan
3. Verify the key at <https://aistudio.google.com/app/apikey> and ensure the Generative Language API is enabled in the Google Cloud Console for your project.
4. **SDK 0.14.0 compatibility:** If you have upgraded `@google/genai` beyond 0.14.0, the API surface has changed and calls will fail. Check `package.json` — the version must be exactly `0.14.0`. Run `npm ci` to restore the locked version.
5. Inline base64 image payloads have a practical size limit of a few MB. If you are sending large images, resize them to below 2 MB before analysis.

### Duplicate detection shows no results after scan

The scan engine uses mock data from `services/`. If the mock data is not loading, check the browser console for JavaScript errors on the Scan page. The mock API does not connect to real file system paths — it uses hardcoded sample files to demonstrate the UI. Real file system integration is a future milestone.

### `npm ci` fails with peer dependency errors

Ensure you are on Node 20+. The `react-datepicker` package requires React 19 as a peer dependency; if you see a peer conflict, verify `react` and `react-dom` are both at `19.2.4` in `package.json`.
