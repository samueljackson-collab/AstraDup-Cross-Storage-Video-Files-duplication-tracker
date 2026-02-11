# AstraDup

Cross-storage AI media duplication tracker for videos, images, and documents.

AstraDup is a React + TypeScript application that helps teams identify duplicate media across multiple storage providers (local, NAS, and cloud) by combining metadata checks with AI-assisted analysis.

## Highlights

- **Cross-storage workflow** for Local/NAS + cloud connectors (Google Drive, Dropbox, OneDrive).
- **Multi-media support** for videos, images, and documents.
- **AI analysis tools** powered by Google Gemini for image/video analysis and grounded Q&A.
- **Duplicate review UX** with comparison views, metadata summaries, and scan result management.
- **Configurable detection settings** for similarity thresholds, modalities, and worker behavior.

## Tech Stack

- **Frontend:** React 19, TypeScript
- **Routing:** React Router 7
- **Build Tool:** Vite 6
- **AI SDK:** `@google/genai`

## Project Structure

```text
.
├── App.tsx                 # Top-level app routing and layout composition
├── index.tsx               # React entry point
├── components/             # Reusable UI components
├── pages/                  # Route-level screens
├── services/               # API and Gemini integration helpers
├── types.ts                # Shared TypeScript types
├── vite.config.ts          # Vite configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Gemini API key from Google AI Studio

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create `.env.local` in the repository root and set:

```dotenv
GEMINI_API_KEY=your_api_key_here
```

The Vite config maps `GEMINI_API_KEY` into `process.env.API_KEY` for the Gemini client.

### 3) Run the development server

```bash
npm run dev
```

This project is configured to run on `http://localhost:3000` by default.

## Production Build

```bash
npm run build
npm run preview
```

## Available Scripts

- `npm run dev` — start the Vite development server
- `npm run build` — create a production build
- `npm run preview` — preview the production build locally

## Notes

- Current storage/provider interactions are represented by frontend service abstractions and demo flows; adapt `services/api.ts` for real backend integration.
- Gemini features require a valid API key and network access.

## Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: add your feature"`)
4. Push and open a pull request

## License

This repository is currently distributed without an explicit OSS license. Add a `LICENSE` file if you plan to open-source or redistribute it.
