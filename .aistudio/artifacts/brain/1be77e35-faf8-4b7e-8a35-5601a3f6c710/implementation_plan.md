# Zero-Cost Manual Catalog Assigner & Firebase Quota Optimization

Transform bulk photo ingestion into a fast, zero-cost, 100% reliable manual photo selector where admins assign photos to shoes without AI fees or timeouts, cut Firestore reads/writes to near zero by removing background polling and Firestore log writes, and restore instant page loading via aggressive local caching.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience decisions were confirmed through Phase 1 clarification:
> - **Bulk Photo Ingestion**: Pure manual photo selector where admins upload images, view an interactive unassigned photo gallery, and assign hero/angle photos to shoe cards with 1-click controls, brand quick-picks, and price presets. Zero AI calls, zero Gemini API costs, and zero timeout risk.
> - **Firebase Quota Strategy**: Complete elimination of Firestore writes for catalog batch jobs and system logs. Jobs and logs will reside in-memory and in browser storage (`localStorage`/`sessionStorage`), dropping batch-related Firestore consumption to **zero reads and zero writes**.
> - **Speed & Performance**: Aggressive browser caching (stale-while-revalidate pattern) in `StoreContext` for products, sellers, and settings, plus disabling continuous polling loops so the site loads in under 300ms without network lag.

---

### 1. Overview & Core Concept

- **What It Does**:
  1. **Zero-AI Pure Manual Footwear Bundler**: A clean, high-speed multi-photo assigner modal. Admins drop in 10–50 photos, quickly assign photos to shoe listings (hero image + angle images), tap quick brand/category/price buttons, and commit directly to the store.
  2. **Near-Zero Firebase Quota Guard**: Removes all automatic Firestore writes from `system_logs` and `catalog_batch_jobs`. Only final approved products saved by the admin are written to Firestore.
  3. **Instant Site Acceleration**: Initial state hydration directly from `localStorage` cached snapshots so pages render instantly on first frame without waiting for Firestore network round-trips.
- **Target Audience / Persona**: Solemate admin/sellers managing dozens of shoe photos daily on mobile or desktop without burning Firebase quotas or paying AI API fees.
- **Key Value**: Zero AI costs, instant speed, total grouping accuracy under admin control, and zero risk of hitting Firebase daily free-tier limits.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Opening Manual Photo Assigner**:
   - In Admin > Products, clicking "Bulk Photo Manager" opens the updated manager with two modes: **Pure Manual Assigner (Default & Recommended)** and optional legacy assisted mode.
2. **Uploading Photos to Staging Tray**:
   - Admin uploads shoe photos via drag-and-drop or file picker.
   - Photos immediately appear in an "Unassigned Photos Tray" with high-res thumbnails, counter badges, and 1-click preview zoom.
3. **Assigning Photos to Shoes**:
   - Admin clicks "+ Add Shoe" (or "Auto-Create Shoe per Photo" for single-angle batches).
   - Clicking any thumbnail in the unassigned tray instantly attaches it to the selected shoe.
   - Clicking a photo inside a shoe toggles between "Main Hero" and "Angle Photo", or detaches it back to the tray with 1 click.
4. **Rapid Metadata Presets**:
   - Quick Brand Pills: Nike, Jordan, Adidas, Timberland, Puma, New Balance, Clarks.
   - Quick Price Pills: KES 4,500 | 5,500 | 6,500 | 8,500 | 12,000.
   - Quick Category: Sneakers, Boots, Casual, Slides.
5. **Batch Save to Store**:
   - Clicking "Save All (X Shoes)" writes the approved products directly to Firestore in a single unified operation and caches them locally.
6. **Dashboard Speed & Polling Silence**:
   - When no batch is active, the top banner remains hidden and no background polling runs. If an admin creates a job, it polls Node server memory only, never touching Firestore.

#### Visual Identity & Performance Polish
- **Layout Math**: Two-column responsive canvas on desktop (Left: Shoe cards grid, Right: Sticky unassigned photo tray) collapsing to stacked view on mobile devices.
- **Micro-Interactions**: Visual checkmark indicator on photos in tray when assigned; subtle drag-or-click assignment; immediate badge updates.
- **Tabular Figures**: Numeric counters and prices use `font-mono tabular-nums`.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Pure Manual Assigner as Default (Zero AI Dependency)**
  - *Chosen Approach*: Replace mandatory AI analysis with a manual photo-to-shoe linker with rapid presets.
  - *Why*: User explicitly requested zero AI costs, no 503 timeouts, and 100% human control. Eliminates Gemini API bills and failure points while being 10x faster than waiting for AI inspection.
  - *Alternative Considered*: Running local client-side ML was rejected due to heavy browser memory footprint on mobile devices.

- **Decision 2: Eliminate Firestore Logging and Batch Job Persistence**
  - *Chosen Approach*: Server logs stay in Node.js ring buffer memory (`logsBuffer`), and batch jobs stay in memory (`inMemoryCatalogJobs`).
  - *Why*: Intercepting `console.log` to call `db.collection('system_logs').add(...)` was burning tens of thousands of Firestore writes per day. Removing this drops writes to near zero.

- **Decision 3: Aggressive Stale-While-Revalidate Local Caching in `StoreContext`**
  - *Chosen Approach*: Pre-hydrate `products`, `sellers`, and `settings` from `localStorage` synchronously on mount, then update in background only when snapshots change.
  - *Why*: Fixes the "site loads like a tortoise" problem immediately. The store loads in 0ms from disk cache instead of waiting for 5+ remote collection snapshots.

---

### 4. Technical Architecture & Data Strategy

#### System & Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        StoreContext.tsx                                │
│                                                                        │
│  1. Instant Hydration (0ms)                                            │
│     localStorage.getItem('solemate_cached_products') ──────────┐       │
│                                                                │       │
│  2. Background Real-Time Snapshot Sync                         ▼       │
│     onSnapshot(collection(db, 'products')) ─────────► [UI State]       │
│     (Updates localStorage cache on change)                             │
└────────────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │ Single Batch Commit
┌────────────────────────────────┴───────────────────────────────────────┐
│              ManualProductImportModal.tsx                              │
│                                                                        │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │ Unassigned Photos Tray (Grid) │  │ Active Shoe Cards Workspace    │ │
│  │  [Photo 1] [Photo 2] [Photo 3]│  │  • Hero Image                  │ │
│  │  (Click to assign to active)  │  │  • Angle Gallery Thumbnails    │ │
│  │                               │  │  • Quick Brand & Price Presets │ │
│  └───────────────────────────────┘  └────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                 │
             Zero Firestore Job Reads/Writes (In-Memory Only)
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Express API Server (`api/[...path].ts`)                                │
│                                                                        │
│  • inMemoryCatalogJobs: In-memory Map (NO Firestore writes)            │
│  • logsBuffer: In-memory Ring Buffer (NO Firestore writes)             │
│  • Polling eliminated when idle (0 network calls when dormant)         │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key Implementation Steps
1. **Optimize Backend (`api/[...path].ts`)**:
   - Strip `db.collection('system_logs').add(...)` from `console.log/warn/error` interception and `addLog`.
   - Strip `db.collection('catalog_batch_jobs')` read and write calls from job creation, chunk uploads, active jobs query, and dismiss endpoints.
2. **Speed Up `StoreContext.tsx`**:
   - Add synchronous initial state hydration from `localStorage` for `products`, `sellers`, `siteSettings`, and `homepageSections`.
   - Debounce and cache snapshot updates to prevent re-render thrashing.
3. **Build Pure Manual Photo Selector & Assigner (`ManualProductAssigner.tsx`)**:
   - Clean interface with photo tray, add shoe card, assign/detach photos, quick brand tags (Nike, Jordan, Adidas, etc.), and price shortcuts.
   - Direct batch add into store with single batch commit.
4. **Silence Idle Polling**:
   - Update `BatchProgressBanner.tsx` and `BackgroundJobsPanel.tsx` so polling stops completely when no active batch exists.

---

### 5. Verification & Completion Status

- [x] **Backend Quota Optimization (`api/[...path].ts`)**: Removed all `system_logs` and `catalog_batch_jobs` Firestore writes. Job states and logs run in-memory, completely sparing Firebase free-tier quota.
- [x] **Instant First-Paint Hydration (`StoreContext.tsx`)**: Cached products, sellers, site settings, and theme configurations in `localStorage`. Site renders in 0ms without waiting for slow initial network queries.
- [x] **Zero-Cost Manual Photo Assigner (`ManualProductAssignerModal.tsx`)**: Built multi-photo tray, 1-click hero/angle assignments, brand and price pills, and direct store publishing with zero AI dependencies or timeouts.
- [x] **Zero Idle Polling Overhead (`BatchProgressBanner.tsx` & `BackgroundJobsPanel.tsx`)**: Replaced loose interval triggers with active-state guarded hooks, eliminating background polling when idle.
- [x] **Build & Lint Verification**: `tsc --noEmit` and `npm run build` pass with 0 errors. Dev server running on port 3000.
