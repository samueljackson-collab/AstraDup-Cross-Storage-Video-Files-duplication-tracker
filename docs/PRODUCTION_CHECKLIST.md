# AstraDup — Production Deployment Checklist

Complete every item before promoting a build to production. Check each box as it is verified.

---

## 1. Environment & Build Configuration

- [ ] `GEMINI_API_KEY` is set in the CI/CD secret store (not committed to version control)
- [ ] `.env` and `.env.local` files are listed in `.gitignore` and are absent from the repository
- [ ] `npx tsc --noEmit` exits with zero TypeScript errors (no lint script is configured in `package.json` — run the compiler directly)
- [ ] `npm run build` completes without errors
- [ ] `dist/` directory is freshly generated from the current commit (no stale artifacts)
- [ ] `process.env.GEMINI_API_KEY` resolves to a non-empty string in the built bundle
- [ ] `@google/genai` is pinned to exactly **0.14.0** in `package-lock.json` — do not allow automatic upgrades to 1.x, which has a breaking API change

---

## 2. Dependency Audit

- [ ] `npm audit` reports no critical or high severity vulnerabilities
- [ ] `package-lock.json` is committed and matches `package.json`
- [ ] `react` and `react-dom` are both at `19.2.4` (exact)
- [ ] `react-router-dom` is at `7.13.0` (exact)
- [ ] `@google/genai` is at `0.14.0` (exact — not a range)
- [ ] No duplicate React instances in the bundle (verify with `npm ls react` — should show a single version)

---

## 3. Core Page Rendering

All seven pages must render without blank screens, JavaScript errors, or routing failures.

- [ ] **Dashboard** (`/`) — stat cards render with numeric values; filter buttons (Video / Image / Document) toggle the view correctly
- [ ] **Scan Page** — storage source picker displays all source types (Local, NAS, S3, GCS, Azure, Google Drive, OneDrive, Dropbox); file type selector works; Start Scan button is interactive
- [ ] **Comparison Page** — both left and right panels render file information; no blank panels or "undefined" text
- [ ] **File Detail** — displays file metadata fields correctly for all three file types (video, image, document)
- [ ] **Analyzer Page** — file upload input accepts image files; text prompt field is editable; Analyze button is present
- [ ] **Video Detail** — video player controls render; enrichment button is visible
- [ ] **Settings** — preference fields load; save action does not throw a console error

---

## 4. Video Frame Extraction Performance

Frame extraction must complete within an acceptable time window to avoid blocking the UI.

- [ ] Select a 30-second H.264 MP4 test video and trigger frame extraction (via the video player seek or comparison view)
- [ ] Confirm that at least one frame is extracted and displayed **within 5 seconds** of the request
- [ ] No browser tab crash (out-of-memory) occurs during extraction of the 30-second test clip
- [ ] Canvas API errors are not logged to the console during extraction
- [ ] Frame extraction works in Chrome, Firefox, and Edge

---

## 5. Duplicate Detection — Match Pairs

- [ ] After running a scan with the mock data set, at least one duplicate pair is displayed in the results list
- [ ] Each duplicate pair card shows: both file thumbnails (or placeholders), similarity score (0–100%), and matched modality labels
- [ ] The similarity score matches the value defined in the mock data fixture (verify at least one pair manually)
- [ ] "Delete Selected" bulk action removes the selected pair from the list without a page crash
- [ ] "Mark as Not Duplicate" dismisses the pair and it does not reappear on re-scan
- [ ] Pairs are sorted by similarity score (highest first) by default

---

## 6. Comparison Page — Both Panels

- [ ] Navigating to the Comparison page for a video duplicate pair renders the video player in **both** left and right panels
- [ ] The video player in each panel is independently controllable (play/pause, seek, volume)
- [ ] Keyboard shortcuts work in whichever panel has focus: `Space` (play/pause), `F` (fullscreen), `M` (mute), arrow keys (seek/volume)
- [ ] For an image duplicate pair, the pixel-level diff overlay renders without a blank canvas
- [ ] For a document duplicate pair, the text diff view shows added/removed/unchanged lines
- [ ] No "Cannot read properties of undefined" console errors appear when navigating between pairs

---

## 7. AI Analyzer — Metadata Return for Test Image

- [ ] Navigate to the Analyzer page
- [ ] Upload a test JPEG or PNG image (under 2 MB)
- [ ] Enter the prompt: "Describe what you see in this image."
- [ ] Click Analyze — the request is sent and a non-empty text response is returned within 30 seconds
- [ ] The response renders as formatted text (not raw JSON or `[object Object]`)
- [ ] Web-grounded citations appear if the model invokes search (verify citation links are rendered, not raw URIs)
- [ ] If the API key is invalid, an error message is displayed to the user — the app does not crash

---

## 8. Performance & Bundle Size

- [ ] Initial page load (hard refresh, no cache) completes in under 5 seconds on a 10 Mbps connection
- [ ] `dist/` total asset size is below 5 MB
- [ ] No single JavaScript chunk exceeds 2 MB (check `dist/assets/` after build)
- [ ] React Router client-side navigation between all 7 pages completes without a full page reload
- [ ] Dashboard renders stat cards within 1 second of navigation (data is mock/in-memory, not a network call)
- [ ] No memory leaks: navigating through all pages and back to Dashboard does not cause heap growth visible in DevTools Memory tab

---

## 9. Browser & Codec Compatibility

- [ ] Chrome 120+ — all pages and video playback verified
- [ ] Firefox 120+ — all pages verified; note that HEVC is not supported (H.264 test clips must be used)
- [ ] Edge 120+ — all pages and video playback verified
- [ ] H.264 MP4 test video plays without codec errors in all three browsers
- [ ] Safari 17+ — basic page rendering verified; video playback with H.264 confirmed
- [ ] No `console.error` output on initial load in any browser
- [ ] `localStorage` access is available and does not throw in the target browser configuration

---

## 10. Security Review

- [ ] The Gemini API key is not present in any committed file
- [ ] `npm audit` shows zero critical vulnerabilities
- [ ] No `eval()` or unsanitised `innerHTML` assignments with user-controlled data
- [ ] React Router routes do not expose internal state via URL parameters that could be manipulated
- [ ] All external links use `rel="noopener noreferrer"`
- [ ] The deployed domain uses HTTPS with a valid TLS certificate
- [ ] `Content-Security-Policy` header is configured at the hosting layer
- [ ] Exported/downloaded files do not embed the Gemini API key
