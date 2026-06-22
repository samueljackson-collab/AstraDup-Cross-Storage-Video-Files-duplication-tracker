# AstraDup — Production Launch Checklist

**Branch:** `claude/personal-launch-readiness-QHBOl`

## Pre-Launch Setup

- [ ] Node 20+ installed
- [ ] `npm install`
- [ ] Create `.env` file:
  ```
  GEMINI_API_KEY=your_key_here
  API_KEY=your_key_here
  ```
- [ ] Get API key: https://aistudio.google.com/apikey
- [ ] `npm run dev` → opens at http://localhost:5173
- [ ] No console errors on startup

> **Note:** `services/api.ts` uses mock/demo data. No real file scanning occurs — this is expected for personal launch testing.

## Feature Verification

| Feature | Steps | Expected Result | Pass/Fail |
|---------|-------|-----------------|----------|
| App loads | Open http://localhost:5173 | Dashboard with stats visible | |
| Dashboard stats | View dashboard | Mock stats: files scanned, duplicates found, space saved | |
| Scan page | Navigate to Scan | Scan config UI renders | |
| Start scan | Click "Start Scan" | Mock scan runs, duplicate pairs appear | |
| Duplicate display | View scan results | DuplicateResultDisplay shows file pairs | |
| Video comparison | Click "Compare" on a pair | Side-by-side comparison renders | |
| AI metadata enrichment | Click "Enrich" on a video | Gemini API called; metadata populated | |
| gemini-2.5-flash | Check console/network on enrichment | No "model not found" error | |
| File detail | Click a file entry | FileDetail page with metadata | |
| Video player | Play a video | CustomVideoPlayer renders and plays | |
| Settings | Navigate to Settings | Config options visible | |
| Storage selector | Click storage types | StorageSelector shows options | |
| Schedule scan | Click "Schedule" | ScheduleScanModal opens | |
| Error boundary | Remove API key → trigger enrichment | ErrorBoundary shows friendly error | |

## AI Integration

- [ ] `services/gemini.ts` uses `gemini-2.5-flash` for all calls
- [ ] `analyzeImage()` returns response without API error
- [ ] `enrichVideoMetadata()` returns structured JSON

## Known Limitations (Demo Mode)

- All file scanning uses mock data from `services/api.ts`
- No real duplicate detection algorithm
- Video enrichment via Gemini works with valid API key
- Client-side API key: fine for personal testing, needs backend proxy for public deployment
