<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1JzcRSnzkQAj8oEWbCFF8gSYRT--97gI0

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
