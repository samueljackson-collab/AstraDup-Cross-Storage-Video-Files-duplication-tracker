# AstraDup: Cross-Storage AI Video De-duplication System

AstraDup is an intelligent media de-duplication system that detects true duplicates across heterogeneous storage (local drives, NAS, cloud buckets) using multi-modal AI analysis. This application provides a user-friendly interface to manage scans, review duplicates, and reclaim storage space.

This project is a React/TypeScript frontend built with Vite and Tailwind CSS, utilizing the Google Gemini API for its AI capabilities.

## Features

-   **Dynamic Dashboard:** Get a high-level overview of scan statistics with interactive filters for videos, images, and documents.
-   **Multi-Modal Scanning:** Find duplicates for videos, images, and documents across local drives, NAS, and various cloud storage providers.
-   **AI-Powered Analysis:** Goes beyond simple hash checks by using perceptual hashing, audio fingerprinting, and scene/text analysis to find true duplicates.
-   **Efficient Result Management:** Review duplicate pairs and perform bulk operations like "Delete Selected" or "Mark as Not Duplicate".
-   **Interactive Comparison:** A side-by-side view to compare duplicates, featuring:
    -   **Detailed Difference Views:** Pixel-level diffs for images and text diffs for documents.
    -   **Advanced Video Player:** A fully functional player with seeking, volume control, fullscreen, and keyboard shortcuts (`Space`, `F`, `M`, Arrow Keys).
-   **Gemini-Powered Tools:**
    -   **AI Metadata Enrichment:** Automatically fetches rich metadata (titles, plots, actors) for video files.
    -   **AI Document Summarization:** Instantly generate concise summaries for text-heavy documents.
    -   **AI Analyzer:** Directly query the Gemini model with images, video frames, or text prompts for analysis and web-grounded answers.
-   **Configurable & Robust:**
    -   **Persistent Settings:** Manage reference databases and other preferences, saved to local storage.
    -   **Responsive UI:** A clean interface that works across devices.
    -   **Error Handling:** A global error boundary ensures a smooth user experience.

## Current Status

This project is currently a **frontend prototype / UI demo**. All scan results, dashboard stats, files, and duplicate pairs come from an in-memory mock data store in `services/api.ts` — there is no real file scanning, storage integration, or backend yet. The Gemini API is wired up and functional for the AI-assisted features (metadata enrichment, document summarization, and the Analyzer page's grounded queries/image analysis); everything else (scan progress, "delete" actions, schedules, connected devices) is simulated for demo purposes.

## Getting Started

### Prerequisites

-   Node.js and npm.
-   A modern web browser.
-   A Google Gemini API Key.

### Environment Setup

This project requires a Google Gemini API key to be available as an environment variable.

1.  Create a `.env` file in the root of the project (or `.env.local`).
2.  Add your API key to the file:

    ```
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

3.  Vite picks up this variable at build/dev time (see `vite.config.ts`) and exposes it to the client code. **Note:** In a true production environment, this key should never be exposed on the client-side. API calls should be proxied through a secure backend server.

### Running the Application

```bash
npm install      # install dependencies
npm run dev       # start the Vite dev server with hot reload
npm run build     # produce a production build in dist/
npm run preview   # serve the production build locally
```

There is currently no automated test suite (`npm test` is not defined). `build.sh` references a test step and Electron packaging (`npm run electron:build:*`), but those scripts are not yet present in `package.json` — the script is aspirational and not fully wired up to the current project.

## Project Structure

-   `App.tsx`: Main application component, sets up `HashRouter` and route definitions.
-   `index.tsx`: React entry point.
-   `/components`: Reusable UI components — `Layout`, `Button`, `Spinner`, `Icons` / `FileTypeIcons`, `CustomVideoPlayer`, `FilePreview`, `DetailViews`, `DuplicateResultDisplay`, `StorageSelector`, `ScheduleScanModal`, `ErrorBoundary`.
-   `/pages`: Top-level routed pages — `Dashboard`, `ScanPage`, `FileDetail`, `VideoDetail`, `ComparisonPage`, `AnalyzerPage`, `Settings`.
-   `/services`: `api.ts` (mock data store and simulated API calls), `gemini.ts` (Gemini API integration for enrichment, summarization, and grounded analysis).
-   `/utils`: Shared utility functions (e.g. `video.ts` for video frame extraction).
-   `/styles`: Additional CSS (e.g. `datepicker.css` for the date picker).
-   `types.ts`: TypeScript type definitions used across the app (files, scans, duplicates, comparison history, etc.).

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Dashboard | High-level scan stats with filters for videos, images, and documents. |
| `/scan` | ScanPage | Configure and run a (simulated) duplicate scan. |
| `/analyzer` | AnalyzerPage | Query Gemini directly with text, images, or video frames. |
| `/file/:fileId` | FileDetail | Details for an image or document file. |
| `/video/:fileId` | VideoDetail | Video file details with the custom video player. |
| `/compare/:fileId1/:fileId2` | ComparisonPage | Side-by-side comparison of two duplicate candidates. |
| `/settings` | Settings | Manage reference metadata databases and connected devices/storage sources. |
