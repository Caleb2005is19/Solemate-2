# Visual Batch Progress Dashboard Banner

A sticky, real-time visual progress monitoring banner for the Solemate Admin Dashboard that tracks asynchronous AI footwear photo batch jobs with live processed vs. pending counts, dynamic time estimation, direct side-by-side catalog review, live job activity logs, and pause/cancel controls.

### Implementation Status: COMPLETED

> [!NOTE]
> All components, backend endpoints, and UI integrations have been implemented, tested, and verified via `tsc --noEmit` and `compile_applet`.

---

### 1. Overview & Core Concept

- **What It Does**: Provides an unmissable, non-intrusive dashboard banner that automatically activates whenever a footwear photo batch is uploading or being sorted by the background AI worker. Displays live progress, processed vs. pending counts, time remaining, and provides instant access to review products, view granular inspection logs, or halt execution.
- **Target Audience / Persona**: Solemate store owners and catalog administrators uploading 10 to 50+ shoe photos at once from mobile phones or desktop without wanting to stay trapped on a loading modal.
- **Key Value**: Transparency and control. Admins know exactly what the background AI worker is doing, how many photos are done vs. pending, how much time remains, and can review results immediately without losing their place.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Batch Ingestion Trigger**: When an admin submits a batch of shoe photos in the AI Mass Photo Import modal, the batch job is registered with the backend. The modal can be closed or minimized at any time.
2. **Sticky Dashboard Banner Display**:
   - The banner slides into view at the top of the Admin Dashboard viewport with a subtle slide-down animation.
   - It remains sticky at the top, visible whether the user navigates between Overview, Products, Inventory, or Orders.
3. **Live Metric Tracking**:
   - **Progress Bar**: Sleek animated dual-tone progress bar with gradient fill (`bg-gradient-to-r from-orange-500 to-amber-500`) and glowing lead edge.
   - **Processed vs. Pending Counter**: Prominent tabular figures (`font-mono tracking-tight`), e.g., `18 / 24 photos processed (6 pending)`.
   - **Velocity & Time Remaining**: Dynamically calculated estimate (e.g., `~25s remaining`), updating smoothly as each photo or chunk completes.
   - **Current Step Indicator**: Clean unboxed status text (e.g., `Analyzing shoe silhouettes & shoebox branding...`).
4. **Interactive Controls**:
   - **Review Items**: When `status === 'completed'` (or during partial processing), clicking "Review Shoes" triggers the side-by-side catalog alignment modal pre-loaded with generated products.
   - **View Activity Logs**: Clicking "View Logs" toggles a compact collapsible drawer showing real-time log entries (photo filenames, detected models, timestamps).
   - **Pause / Cancel**: Clicking "Cancel" prompts a swift confirmation and safely cancels remaining queue processing.
5. **Dismissal**: When completed or dismissed, the banner cleanly transitions out with a dismiss button (`X`), leaving the dashboard spotless.

#### Visual Identity & Theme (SaaS Dashboard & Anti-Slop Discipline)
- **Palette & Atmosphere**: Dark technical slate banner (`bg-zinc-950 text-white border border-zinc-800 shadow-xl`) with high-contrast Solemate Orange accents (`text-orange-400`, `bg-orange-500`).
- **Typography & Tabular Numerals**: Numeric counters and timers use `font-mono tabular-nums font-bold` to eliminate visual layout jitter during high-frequency status polling.
- **Zero-Pill Compliance**: No arbitrary static pill enclosures. Statuses, counts, and times are displayed as clean, structured typographic hierarchy with subtle divider lines and icon pairings.
- **Spatial Math**: 16px vertical padding (`py-4`), 24px horizontal padding (`px-6`), `rounded-2xl` container with subtle border elevation.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Sticky Top Banner vs. In-Page Tab Component**
  - *Chosen Approach*: Sticky banner above the main dashboard tabs in `Dashboard.tsx`.
  - *Why*: Large batches of 20–50 photos can take 1–2 minutes. Placing the banner persistently at the top allows admins to inspect sales, view orders, or edit settings while keeping visual oversight of background AI processing.
  - *Alternative Considered*: Embedding inside the Products tab only was discarded because users navigating away lose real-time visibility.

- **Decision 2: Polling Frequency & Offline Tolerance**
  - *Chosen Approach*: Adaptive polling (every 2.5 seconds when active jobs exist; every 12 seconds when idle or all jobs completed). If network drops momentarily, polling retries silently with exponential backoff and displays an unobtrusive "Reconnecting..." indicator without disrupting user state.
  - *Why*: Balances real-time responsiveness with minimal server overhead and smooth mobile connection resilience.

- **Decision 3: Server-side Cancellation & In-Memory Job Logs**
  - *Chosen Approach*: Adding `/api/catalog/jobs/:jobId/cancel` and tracking detailed step logs (`job.logs = [...]`) directly in the backend job structure.
  - *Why*: Gives the admin complete control to stop runaway jobs if wrong photos were accidentally uploaded, and provides transparent visibility into what the AI identified.

---

### 4. Technical Architecture & Data Strategy

#### Component Hierarchy & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Dashboard.tsx                                   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ BatchProgressBanner.tsx (Sticky Top Bar)                         │  │
│  │                                                                  │  │
│  │  [Status & Model]   [Processed / Pending]   [Est. Time]  [Actions]│  │
│  │  ├─ 68% Progress Bar (Animated) ──────────────────────────────┤  │
│  │  └─ Collapsible Live Logs Drawer ─────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │ Main Navigation Tabs          │  │ Active Tab View Content        │ │
│  │ (Overview, Products, Orders)  │  │ (Products list, Reports, etc.) │ │
│  └───────────────────────────────┘  └────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                               │
               Polling (GET /api/catalog/jobs/active)
               Actions (POST /api/catalog/jobs/:id/cancel)
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Express API Server (`api/[...path].ts`)                                │
│                                                                        │
│  • inMemoryCatalogJobs Map + Firestore fallback                        │
│  • Job Lifecycle: uploading -> queued -> processing -> completed/failed│
│  • Real-time logs buffer attached to each batch job                     │
└────────────────────────────────────────────────────────────────────────┘
```
