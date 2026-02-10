 <h1>AstraDup</h1>
  <p><strong>Cross-Storage AI Video &amp; Media De-duplication System</strong></p>

  <p>
    <a href="#features">Features</a> &bull;
    <a href="#getting-started">Getting Started</a> &bull;
    <a href="#architecture">Architecture</a> &bull;
    <a href="#usage">Usage</a> &bull;
    <a href="#configuration">Configuration</a> &bull;
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## Overview

AstraDup is an intelligent media de-duplication system that detects true duplicates across heterogeneous storage — local drives, NAS, and cloud buckets (Google Drive, Dropbox, OneDrive) — using multi-modal AI analysis powered by Google Gemini.

Unlike simple file-hash checks, AstraDup understands the **content** of your files. It finds duplicates even when they've been re-encoded, renamed, cropped, or edited by leveraging perceptual hashes, audio fingerprints, scene embeddings, and face clustering.

## Features

- **Multi-File-Type Support** — Scan and de-duplicate videos, images, and documents
- **Cross-Storage Scanning** — Analyze files across local drives, NAS, Google Drive, Dropbox, and OneDrive simultaneously
- **AI-Powered Analysis** — Uses perceptual hashing (pHash/dHash), audio fingerprinting, scene embeddings, and face clustering
- **Side-by-Side Comparison** — Visually compare duplicate pairs with highlighted metadata differences and pixel-diff overlays
- **Metadata Enrichment** — AI-driven metadata lookup from IMDb, TMDb, TVDB, and more with configurable sources
- **AI Analyzer Toolkit** — Standalone image analysis, video frame analysis, and web-grounded Q&A powered by Gemini
- **Document Summarization** — AI-generated summaries for document files using Gemini
- **Custom Video Player** — Built-in video player with seek, volume, and fullscreen controls
- **Configurable Detection** — Adjustable similarity thresholds, matching modalities, and parallel worker counts
- **Responsive Design** — Collapsible sidebar, mobile-friendly layout with dark hacker-themed UI

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- A **Google Gemini API key** ([get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/samueljackson-collab/AstraDup-Cross-Storage-Video-Files-duplication-tracker.git
cd AstraDup-Cross-Storage-Video-Files-duplication-tracker

# Install dependencies
npm install

# Configure your API key
cp .env.local.example .env.local
# Edit .env.local and set GEMINI_API_KEY=your_key_here

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm run preview
```

## Architecture

```
├── index.html            # Entry HTML with Tailwind CDN and import map
├── index.tsx             # React root mount
├── App.tsx               # Router configuration (HashRouter)
├── types.ts              # TypeScript interfaces and type definitions
├── vite.config.ts        # Vite configuration with React plugin
├── tsconfig.json         # TypeScript compiler options
├── components/
│   ├── Layout.tsx        # App shell with sidebar navigation and header
│   ├── Button.tsx        # Reusable button component (primary/secondary variants)
│   ├── DuplicateResultDisplay.tsx  # Scan results with bulk actions
│   ├── FilePreview.tsx   # File preview cards (video/image/document)
│   ├── StorageSelector.tsx # Storage source picker with cloud connect flow
│   ├── Icons.tsx         # SVG icon components
│   ├── FileTypeIcons.tsx # File-type specific icons (Film, Photo, Document)
│   └── Spinner.tsx       # Loading spinner
├── pages/
│   ├── Dashboard.tsx     # Overview stats, filters, and recent activity
│   ├── ScanPage.tsx      # Multi-step scan wizard (type → source → scan → results)
│   ├── FileDetail.tsx    # File detail view with tabs (properties, analysis, duplicates)
│   ├── ComparisonPage.tsx # Side-by-side duplicate comparison with actions
│   ├── AnalyzerPage.tsx  # AI toolkit (image/video/web analysis)
│   └── Settings.tsx      # App configuration (detection, enrichment, performance)
└── services/
    ├── api.ts            # Data service layer (mock data for demo)
    └── gemini.ts         # Google Gemini AI integration (image, video, grounded search)
```

### Tech Stack

| Layer       | Technology                               |
| ----------- | ---------------------------------------- |
| Framework   | React 19 with TypeScript                 |
| Routing     | React Router v7 (HashRouter)             |
| Styling     | Tailwind CSS (CDN)                       |
| Build Tool  | Vite 6                                   |
| AI Backend  | Google Gemini API (`@google/genai`)      |
| AI Models   | `gemini-3-pro-preview`, `gemini-3-flash-preview` |

## Usage

### Dashboard
View aggregate statistics across all scanned file types. Filter by videos, images, or documents to see type-specific metrics.

### Duplicate Scan
1. **Select file type** — Choose Videos, Images, or Documents
2. **Select storage sources** — Pick local/NAS drives or connect cloud providers (OAuth flow)
3. **Configure enrichment** — Choose metadata databases for the scan
4. **Review results** — Browse duplicate pairs, compare side-by-side, or bulk-delete

### AI Analyzer
Upload images or videos for AI-powered analysis, or ask web-grounded questions — all powered by Google Gemini.

### Settings
Configure similarity thresholds, matching modality requirements, filename templates, enrichment databases, and performance options.

## Configuration

### Environment Variables

| Variable         | Description              | Required |
| ---------------- | ------------------------ | -------- |
| `GEMINI_API_KEY` | Google Gemini API key    | Yes      |

Set in `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

### Detection Settings (via UI)

- **Similarity Threshold** — Minimum confidence score (75-99%) to flag duplicates
- **Matching Modalities** — Minimum number of matching signals required
- **Parallel Workers** — Concurrent processing threads
- **GPU Acceleration** — Toggle hardware acceleration for embeddings

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Update `.env.local` with your Gemini API key:
   ```dotenv
   GEMINI_API_KEY=your_api_key_here
   ```
4. Run the app:
   ```bash
   npm run dev
   ```
## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is provided as-is for educational and demonstration purposes.
