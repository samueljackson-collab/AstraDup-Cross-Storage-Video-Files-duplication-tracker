# AstraDup: Cross-Storage AI Deduplication Tracker

AstraDup is a cross-storage duplication tracker for videos, images, and documents. It provides an AI-assisted workflow to scan multiple storage sources, compare duplicate candidates, and enrich metadata so you can confidently reclaim space without losing important files.

## Table of Contents

- [Overview](#overview)
- [Key Capabilities](#key-capabilities)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Configuration Categories](#configuration-categories)
  - [Scan Types](#scan-types)
  - [Storage Sources](#storage-sources)
  - [AI Analysis Tools](#ai-analysis-tools)
  - [Comparison & Resolution](#comparison--resolution)
  - [Settings](#settings)
- [Generated Output & Data Flow](#generated-output--data-flow)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [API Configuration](#api-configuration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

AstraDup is designed to help teams reduce duplicate media across local drives, NAS devices, and cloud providers. It goes beyond basic file hashing by combining multi-modal signals (hashes, embeddings, and metadata) with AI-assisted enrichment to identify real duplicates, even when files are re-encoded, renamed, or lightly edited.

Core workflow:

1. Select the file type to scan (video, image, or document).
2. Choose storage sources to include in the scan.
3. Review duplicates, compare files side-by-side, and decide what to keep.
4. Use AI tools to enrich metadata or analyze content when needed.

## Key Capabilities

- **Multi-type scans**: Separate flows for videos, images, and documents.
- **Cross-storage coverage**: Local drives, NAS, and popular cloud providers.
- **Duplicate comparison**: Side-by-side detail views with similarity signals.
- **AI Analyzer**: Image, video, and web analysis backed by Gemini models.
- **Metadata enrichment**: Suggested titles, plots, genres, and actors for videos.
- **Operational safeguards**: Confirmation dialogs before destructive actions.

## System Requirements

- **Node.js**: 18.x or higher
- **Modern browser**: Latest Chrome, Edge, Firefox, or Safari
- **API key**: Required for Gemini-powered analysis features

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/samueljackson-collab/AstraDup-Cross-Storage-Video-Files-duplication-tracker.git astra-dup
   cd astra-dup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API key**

   Create a `.env.local` file in the project root:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```

5. **Open your browser** at the URL shown in the terminal (typically `http://localhost:5173`).

### Production Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Getting Started

### Quick Start

1. Open the app and go to **Duplicate Scan**.
2. Pick **Videos**, **Images**, or **Documents**.
3. Select storage sources to scan (local, NAS, or cloud).
4. Start the scan and review duplicate sets.
5. Compare pairs and decide which file to keep.

### Example Workflow

**Goal**: Clean up duplicate videos across a NAS and Google Drive.

1. Go to **Duplicate Scan** → select **Videos**.
2. Choose **NAS** and **Google Drive** as sources.
3. Start the scan and wait for results.
4. Use the comparison view to inspect metadata and similarity signals.
5. Keep the best-quality version and remove the rest.

## Usage Guide

### Interface Overview

- **Dashboard**: Snapshot of scan statistics and recent activity.
- **Duplicate Scan**: Step-by-step scan flow (type → sources → scan → results).
- **Comparison**: Deep dive into a specific duplicate pair with side-by-side details.
- **AI Analyzer**: Standalone image, video, and web analysis tools.
- **Settings**: Configure detection thresholds, performance, and metadata sources.

### Duplicate Scan Flow

1. **Select File Type**: Videos, images, or documents.
2. **Choose Storage Sources**: Toggle local, NAS, and cloud providers.
3. **Run Scan**: Progress and estimated time remaining are displayed.
4. **Review Results**: Inspect duplicate pairs and navigate to file details.

### AI Analyzer

- **Image Analysis**: Upload a still image and ask questions about its content.
- **Video Analysis**: Upload a video, extract frames, and summarize its contents.
- **Web Analysis**: Ask a question and retrieve grounded web results.

## Configuration Categories

### Scan Types

| Type | Focus | Typical Signals |
|------|-------|-----------------|
| Video | Video files | pHash, dHash, scene embeddings, audio fingerprint, face clusters |
| Image | Photo files | pHash, dHash, EXIF metadata, object tags |
| Document | PDF/doc files | Text hash, keyword density, content similarity |

### Storage Sources

| Source | Description |
|--------|-------------|
| Local Drive | Files stored on the current device |
| NAS | Network-attached storage shares |
| Google Drive | Cloud drive integration |
| Dropbox | Cloud storage integration |
| OneDrive | Microsoft cloud storage integration |

### AI Analysis Tools

| Tool | Description |
|------|-------------|
| Image Analysis | Gemini-powered image understanding with custom prompts |
| Video Analysis | Frame-based Gemini analysis for summaries and tags |
| Web Analysis | Grounded search queries for real-time answers |

### Comparison & Resolution

- Side-by-side details: resolution, codec, duration, size, and metadata.
- Similarity signals with confidence meters.
- Keep/delete actions with confirmation prompts.

### Settings

- **Similarity threshold**: Minimum confidence score for duplicates.
- **Matching modalities**: Required number of matching signals.
- **Parallel workers**: Controls scan throughput.
- **GPU acceleration**: Toggle for accelerated analysis.
- **Reference databases**: Manage metadata sources (IMDb, TMDb, custom APIs).

## Generated Output & Data Flow

AstraDup is currently front-end only and uses a mocked API layer for demo purposes. Scans, file details, and duplicate pairs are simulated so the UI workflow can be exercised without connecting to real storage backends.

- **Mock data** is defined in `services/api.ts` and returned with simulated delays.
- **AI requests** call Gemini models via `services/gemini.ts`.
- **Delete actions** in the comparison view are UX-only (no real file operations).

## Project Structure

```
astra-dup/
├── App.tsx                 # App routes
├── index.tsx               # App entry point
├── index.html              # HTML template
├── metadata.json           # App metadata
├── pages/                  # Route-level pages
│   ├── Dashboard.tsx
│   ├── ScanPage.tsx
│   ├── ComparisonPage.tsx
│   ├── AnalyzerPage.tsx
│   ├── Settings.tsx
│   ├── FileDetail.tsx
│   └── VideoDetail.tsx
├── components/             # Shared UI components
├── services/               # Mock API + Gemini integration
└── types.ts                # Shared type definitions
```

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React            | 18.x   | UI framework              |
| TypeScript       | 5.x    | Type safety               |
| Vite             | 5.x    | Build tool and dev server |
| Google GenAI SDK | latest | Gemini API integration    |
| React Router     | 6.23.x | Routing                   |

## API Configuration

AstraDup uses Gemini models for AI analysis and enrichment. Provide an API key via environment variables:

```bash
# .env.local
GEMINI_API_KEY=your-api-key-here
```

If the key is missing, the UI will still load, but AI analysis requests will fail.

## Troubleshooting

### Common Issues

**"GEMINI_API_KEY environment variable not set"**
- Ensure `.env.local` exists in the project root.
- Confirm the variable name is `GEMINI_API_KEY`.
- Restart the dev server after editing the file.

**AI analysis fails**
- Validate your API key and network connectivity.
- Confirm the Gemini model is available to your account.

**No scan results**
- The current implementation uses mock data; results are simulated.
- Replace `services/api.ts` with real backend integrations to scan live data.

**Upload errors in the Analyzer**
- Ensure the file type matches the selected tool.
- For videos, verify the browser can decode the file format.

## Best Practices

- **Validate before deleting**: Always review both files in the comparison view.
- **Use AI enrichment**: Add titles and metadata before archiving.
- **Start small**: Run scans on one storage source before combining multiple.
- **Plan integrations**: When connecting real storage, add audit logs and rollback safeguards.

---

## License

This project is provided as-is for deduplication and storage management workflows.

## Contributing

Contributions are welcome. Please keep documentation updated with any UI or workflow changes.
