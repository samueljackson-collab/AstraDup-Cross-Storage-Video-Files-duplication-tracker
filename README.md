<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# AstraDup

**Cross-Storage AI Video, Image & Document De-duplication System**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vitejs.dev)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-4285f4?logo=google)](https://ai.google.dev)

</div>

---

AstraDup is an intelligent de-duplication system that detects true duplicates across heterogeneous storage — local drives, NAS, and cloud providers — using multi-modal AI analysis. Unlike simple file hash checks, AstraDup understands the **content** of your files, finding duplicates even when they have been re-encoded, renamed, resized, or edited.

## Table of Contents

- [Features](#features)
- [Supported Storage Sources](#supported-storage-sources)
- [Supported File Types](#supported-file-types)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [AI Analysis Modalities](#ai-analysis-modalities)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [License](#license)

## Features

- **Multi-type duplicate scanning** — Scan for duplicate videos, images, or documents across all connected storage sources in a single workflow.
- **Cross-storage support** — Connect local drives, NAS devices, Google Drive, Dropbox, and OneDrive with SSO authentication.
- **AI-powered content analysis** — Goes beyond simple checksums by using perceptual hashing, audio fingerprinting, scene embeddings, face clustering, object tagging, and text similarity.
- **Side-by-side comparison** — Compare duplicate pairs with detailed metadata diffs. Includes pixel-level diff overlay for images and inline text diff for documents.
- **AI Analyzer tools** — Upload images or videos for analysis with custom prompts using Google Gemini. Includes a web-grounded search tool for real-time information retrieval.
- **Video metadata enrichment** — Automatically identify videos using AI frame analysis, then enrich metadata (title, plot, actors, genre) from online databases via Google Search grounding.
- **Interactive dashboard** — Overview of scan statistics with filters by file type (videos, images, documents) and a recent activity feed.
- **Configurable detection engine** — Adjust similarity thresholds, required matching modalities, parallel worker count, and GPU acceleration settings.
- **Reference database management** — Manage metadata enrichment sources (IMDb, TMDb, TVDB) and discover new sources using AI-powered search.
- **Responsive UI** — Collapsible sidebar navigation with full mobile support. Built with Tailwind CSS and a dark slate theme.

## Supported Storage Sources

| Source | Type | Connection |
|---|---|---|
| Local Drive | Local | Auto-detected |
| NAS | Network | Auto-detected |
| Google Drive | Cloud | SSO authentication |
| Dropbox | Cloud | SSO authentication |
| OneDrive | Cloud | SSO authentication |

Additional cloud providers (AWS S3, Google Cloud Storage, Azure Blob) are defined in the type system for future expansion.

## Supported File Types

### Videos
Analyzed using perceptual hashing (pHash), difference hashing (dHash), scene embeddings, audio fingerprinting, and face clustering. Supports metadata enrichment via AI and web search.

### Images
Analyzed using perceptual hashing, difference hashing, EXIF data comparison, and AI object tagging. Comparison view supports pixel-level diff overlay.

### Documents
Analyzed using text hashing, keyword density analysis, and cosine similarity. Comparison view supports inline text diff highlighting.

## Tech Stack

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev) | UI framework |
| [TypeScript 5.8](https://www.typescriptlang.org) | Type safety |
| [Vite 6](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first styling |
| [React Router 6](https://reactrouter.com) | Client-side routing |
| [Google Gemini AI](https://ai.google.dev) | Image/video analysis, web-grounded search, metadata enrichment |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or later recommended)
- A [Google Gemini API key](https://ai.google.dev)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/samueljackson-collab/AstraDup-Cross-Storage-Video-Files-duplication-tracker.git
   cd AstraDup-Cross-Storage-Video-Files-duplication-tracker
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env.local` file in the project root:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
.
├── components/
│   ├── Button.tsx              # Reusable button component
│   ├── DuplicateResultDisplay.tsx  # Scan result cards with comparison links
│   ├── FilePreview.tsx         # File preview component
│   ├── FileTypeIcons.tsx       # SVG icons for video/image/document types
│   ├── Icons.tsx               # General SVG icon components
│   ├── Layout.tsx              # App shell with sidebar and header
│   ├── Spinner.tsx             # Loading spinner
│   └── StorageSelector.tsx     # Storage source picker with SSO connect
├── pages/
│   ├── AnalyzerPage.tsx        # AI image/video/web analyzer tools
│   ├── ComparisonPage.tsx      # Side-by-side duplicate comparison
│   ├── Dashboard.tsx           # Overview stats and activity feed
│   ├── FileDetail.tsx          # File detail view (images & documents)
│   ├── ScanPage.tsx            # Duplicate scan workflow
│   ├── Settings.tsx            # Detection, performance & database settings
│   └── VideoDetail.tsx         # Video-specific detail view with enrichment
├── services/
│   ├── api.ts                  # Mock API layer with sample data
│   └── gemini.ts               # Google Gemini AI integration
├── App.tsx                     # Root component with route definitions
├── index.tsx                   # React DOM entry point
├── types.ts                    # TypeScript type definitions
├── index.html                  # HTML template with Tailwind CDN
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Overview stats, file type filters, and recent activity |
| `/scan` | Duplicate Scan | Step-by-step scan workflow: select file type, choose storage sources, run scan, view results |
| `/analyzer` | AI Analyzer | Three tools: image analysis, video frame analysis, and web-grounded search — all powered by Gemini |
| `/file/:fileId` | File Detail | Detailed view with tabs for properties, AI analysis signals, and linked duplicates |
| `/compare/:fileId1/:fileId2` | Comparison | Side-by-side duplicate comparison with metadata diffs, pixel diff (images), and text diff (documents) |
| `/settings` | Settings | Configure similarity threshold, matching modalities, parallel workers, GPU acceleration, and reference databases |

## AI Analysis Modalities

AstraDup uses multiple analysis signals to determine content similarity:

| Modality | File Types | Description |
|---|---|---|
| **Perceptual Hash (pHash)** | Video, Image | Content-based hash resilient to re-encoding and resizing |
| **Difference Hash (dHash)** | Video, Image | Gradient-based hash for structural comparison |
| **Scene Embeddings** | Video | Neural network embeddings of key video scenes |
| **Audio Fingerprint** | Video | Acoustic fingerprint matching (e.g., Chromaprint) |
| **Face Clusters** | Video | Number of distinct face clusters detected |
| **Object Tags** | Image | AI-detected objects and scene labels |
| **EXIF Comparison** | Image | Camera model, timestamp, and ISO matching |
| **Text Hash** | Document | Content hash of extracted text |
| **Keyword Density** | Document | Term frequency analysis |
| **Cosine Similarity** | Document | Vector-space text similarity scoring |

Each modality reports a **confidence score** (0-100%), and duplicates are identified when the configured number of modalities exceed the similarity threshold.

## Configuration

Settings are available via the in-app Settings page (`/settings`):

### Detection
- **Similarity Threshold** — Minimum confidence score (75-99%) to flag a pair as duplicate. Default: 95%.
- **Matching Modalities** — Minimum number of matching signals required. Default: 3.

### Performance
- **Parallel Workers** — Number of files processed simultaneously. Default: 4.
- **GPU Acceleration** — Enable GPU for faster embedding generation (requires compatible hardware). Default: on.

### Reference Databases
- Built-in sources: IMDb, TMDb, TVDB
- AI-powered database discovery using web search
- Manual custom source addition

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server on port 3000 |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |

## License

This project is provided as-is for educational and personal use.
