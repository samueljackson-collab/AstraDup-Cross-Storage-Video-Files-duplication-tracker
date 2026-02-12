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

## Getting Started

### Prerequisites

-   A modern web browser.
-   A Google Gemini API Key.

### Environment Setup

This project requires a Google Gemini API key to be available as an environment variable.

1.  Create a `.env` file in the root of the project.
2.  Add your API key to the file:

    ```
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

3.  The development server (Vite) will automatically pick up this variable. **Note:** In a true production environment, this key should never be exposed on the client-side. API calls should be proxied through a secure backend server.

### Running the Application

This is a frontend-only application designed to be served by a static file server or a development server like Vite.

## Project Structure

-   `/components`: Reusable React components (Buttons, Icons, Layout, etc.).
-   `/pages`: Top-level page components corresponding to application routes.
-   `/services`: Modules for interacting with external APIs (Gemini, mock data API).
-   `/utils`: Shared utility functions (e.g., video frame extraction).
-   `App.tsx`: Main application component with routing setup.
-   `types.ts`: TypeScript type definitions for the entire application.
