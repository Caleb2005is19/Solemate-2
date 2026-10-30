# Asynchronous Background AI Shoe Catalog Engine & Offline-Tolerant Queue

## Problem & Vision
When uploading large batches of 50–100+ shoe photos on a mobile device, active HTTP connections time out, reverse proxies reject large payloads (HTTP 413 "Request Entity Too Large"), and hammering the AI API too quickly triggers HTTP 503 demand spikes.

**The Solution:**
Decouple photo uploading from AI processing into an **asynchronous, server-driven background queue**.
1. **Fast, Lightweight Upload**: The mobile device quickly sends compressed photos in small 5-photo micro-chunks so connections never drop or trigger 413 errors.
2. **Device Can Go Offline**: Once the photos are stored, the merchant can close their browser, lock their phone, or disconnect completely.
3. **Paced Server Background Worker**: The server processes photos at a steady, calm pace (e.g. 2–3 photos at a time with a 2-second breathing cooldown between AI requests), eliminating timeouts and 503 high-demand errors.
4. **Resumable State in Firestore**: Every step and intermediate match is persisted in a `catalog_batch_jobs` collection. If a server or network hiccup occurs, it resumes right where it left off.
5. **Interactive Review When You Return**: When the merchant opens the app later, a friendly banner alerts them: *"✅ Batch #104 Complete (104 photos sorted into 46 verified shoes). Tap to Review & Publish"*.

---

## 1. Technical Architecture & Workflow

```
[ Merchant's Phone / Device ]
       │
       │ 1. Client-Side Canvas Compression (~30KB per photo)
       │ 2. Uploads in small chunks of 5 photos to server
       ▼
[ Server Photo Ingestion API ] ──► Stores images & initializes job in Firestore:
                                   `catalog_batch_jobs/{jobId}`
                                   {
                                     status: 'queued',
                                     totalPhotos: 104,
                                     processedCount: 0,
                                     progressPercent: 0,
                                     sellerId: '...',
                                     photos: [...]
                                   }
       │
       ▼ (Merchant can now close browser / go OFFLINE completely)
[ Server Background Queue Worker ]
       │
       │ ──► Reads next unprocessed micro-batch (2-3 photos)
       │ ──► Calls Grounded Gemini Vision (with 503 failover to gemini-flash-latest)
       │ ──► Pauses with a 2-second cooldown (prevents rate limits & timeouts)
       │ ──► Appends identified shoes & updates progress in Firestore:
       │     `catalog_batch_jobs/{jobId}`: { processedCount: 24, progressPercent: 23% }
       │ ──► Repeats until 100% finished
       ▼
[ Job Status: 'completed' ]
       │
       ▼ (Merchant re-opens app on phone or desktop)
[ Admin Live Job Tracker Banner ]
       │
       └──► "Batch #104 is ready! 48 shoes sorted from 104 photos."
       └──► [ Review & Approve ] ──► Side-by-Side Review ──► Publish to Store
```

---

## 2. Step-by-Step Implementation Roadmap

### Step 1: Persistent Background Job Schema in Firestore
- Collection: `catalog_batch_jobs`
- Job Document Structure:
  - `id`: unique batch ID (e.g., `job_179336...`)
  - `sellerId`: merchant storefront ID
  - `sellerName`: display name of the seller
  - `status`: `'uploading' | 'queued' | 'processing' | 'completed' | 'failed'`
  - `totalPhotos`: number of photos submitted
  - `processedPhotos`: count of analyzed photos
  - `progressPercent`: 0 to 100
  - `statusMessage`: descriptive message (e.g., *"Analyzing photo 45 of 104: Timberland 6-Inch Premium..."*)
  - `items`: array of stored photo records `{ id, url, fileName }`
  - `products`: array of recognized and grouped products with confidence & visual evidence
  - `error`: null or error description if unrecoverable
  - `createdAt`, `updatedAt`, `completedAt`

### Step 2: Chunked Upload API & Server Storage
*Target: `api/[...path].ts`, `src/components/admin/MassProductImportModal.tsx`*
- **Client Compression**: Compress each photo down to a fast web thumbnail (~30KB) before transmission.
- **Micro-Upload Endpoint (`/api/catalog/jobs/create` & `/api/catalog/jobs/:jobId/upload-chunk`)**:
  - Accepts 5 photos per HTTP POST.
  - Returns `200 OK` in under 300ms, completely avoiding HTTP 413 "Request Entity Too Large" and mobile connection timeouts.
- **Offline Handoff**: Once the last chunk is uploaded, the modal displays:
  - *"✨ All 104 photos uploaded safely to your server! The AI is now processing your catalogue in the background. You can safely close this screen or go offline."*

### Step 3: Paced Background AI Worker with Auto-Failover
*Target: `api/[...path].ts` / background queue daemon*
- **Steady Pacing (Cooldown Engine)**:
  - Instead of blasting 104 photos at once, the worker processes 2–3 photos per step.
  - Enforces a 1.5s–2.0s sleep interval between Gemini requests, ensuring zero 503 high-demand errors.
- **Robust Failover & Exponential Backoff**:
  - Primary attempt: `gemini-3.8-flash`.
  - If a 503 spike occurs, automatically wait 3 seconds and retry with `gemini-flash-latest`.
  - Strictly adheres to the **anti-hallucination policy**: if a shoe is unidentifiable, marks it honestly as *"Unverified Model"* without guessing fake hype sneaker names.
- **Resilience**:
  - If the server restarts, any job in `'processing'` or `'queued'` state automatically resumes from its last processed photo index.

### Step 4: Admin Background Jobs Monitor & Review UI
*Target: `src/components/admin/BackgroundJobsPanel.tsx`, `MassProductImportModal.tsx`*
- **Active Jobs Card in Admin Catalog**:
  - Visible at the top of the Admin Products / Catalog page.
  - Shows real-time progress bar, e.g.:
    - *"⚡ Background AI Catalog: Sorting 104 photos (42/104 completed — 40%)"*
    - Pulsing status indicator showing active photo being inspected.
- **Completed Batch Review Modal**:
  - Tapping *"Review Completed Batch"* opens the side-by-side inspection screen.
  - Review all recognized shoes, confidence scores, and visual evidence.
  - 1-click photo detachment / deletion for any misgrouped angle.
  - Tap *"Publish All to Store"* to commit the verified shoes to Firestore.

### Step 5: Vite HMR WebSocket Filter
*Target: `src/services/loggingService.ts`*
- Filter out dev-server HMR reconnection noise (`WebSocket closed without opened`) so Firestore error logs remain clean and focused on real store activity.

### Step 6: Full Verification & Compile Check
- Run `npm run build` and `compile_applet` to verify TypeScript types, component integration, and backend API routes.

---

## 3. Approval Confirmation
Please review this updated plan. Once you click **Proceed** or approve in chat, we will begin with **Step 1 & Step 2** (the chunked upload and job queue).
