# Catalog Recovery & Rapid Visual Product Aligner

Provide an immediate recovery toolkit for the 52 misaligned footwear products (1-click batch delete/rollback or ultra-fast inline visual editing) and upgrade the mass photo import with visual drag-and-drop grouping controls so photo-to-shoe alignment is always 100% accurate before saving.

## User Review & Critical Decisions

> [!IMPORTANT]
> The AI batch analysis misassigned shoe names and paired photos incorrectly across the 52 imported items. To save you from having to edit 52 items manually one by one, we are implementing two immediate solutions:
> 1. **1-Click Batch Rollback**: A single button to wipe all 52 misaligned items from Firestore at once so you can re-import cleanly.
> 2. **Rapid Visual Catalog Aligner**: A high-density spreadsheet grid with live photo thumbnails, 1-click name suggestion chips, and instant inline photo swappers to fix names and prices in minutes rather than hours.

- **Immediate Action**: Provide both 1-click batch rollback and high-speed inline table editing.
- **Future Import Alignment**: Add visual thumbnail grouping where you can drag and verify which photos belong to each shoe *before* any product is generated or saved.

---

## 1. Overview & Core Concept

- **What It Does**:
  - **Batch Cleanup & Selective Deletion**: Multi-select checkboxes on the Products table + a "Rollback Recent Import (52 items)" button that safely deletes the imported batch in a single atomic Firestore operation.
  - **Rapid Inline Visual Catalog Aligner**: A fast, distraction-free editing grid where administrators can see each shoe's primary photo, click quick-fill chips for common Kenyan sneaker names (Air Jordan 4, Timberland 6-Inch, Samba OG, Dunk Low Panda, Air Force 1), edit prices in-place, and swap images without navigating through nested modal forms.
  - **Interactive Pre-Save Photo Grouping in Mass Import**: Redesigned import workflow that displays thumbnail cards for every uploaded image, allowing the admin to group photos of the same shoe visually with 1-click drag/reassign buttons before running AI naming.
- **Target Audience / Persona**: Store administrator managing footwear inventory and product listings on Solemate.co.ke.
- **Key Value**: Eliminates hours of tedious individual product editing, restores catalog integrity immediately, and prevents future photo-to-name mismatches.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ Admin Products View ]
       │
       ├──► [ 1-Click Rollback Recent Import ] ──► Atomic Firestore Delete (52 items) ──► Clean Slate
       │
       ├──► [ Quick Visual Aligner Modal ] ────► High-Density Grid (Photos + Inline Inputs + Quick Chips) ──► Instant Save
       │
       └──► [ Upgraded AI Mass Import ] ───────► Upload ──► Visual Grouping Canvas ──► Confirm & Publish
```

### Visual Identity & Theme
- **Layout & Structure**: High-density SaaS table with 48px row heights, sticky thumbnail preview columns, and subtle border lines (`border-zinc-200 dark:border-zinc-800`).
- **Typography & Formatting**: Tabular monospace numbers for KES pricing (`font-mono tabular-nums`), clean unboxed metadata badges, and quiet status indicators.
- **Quick-Fill Name Chips**: Pill-free segmented quick-select tags above the title input (e.g. `[Jordan 4]`, `[Dunk Panda]`, `[Timberland]`, `[Samba]`, `[Air Force 1]`, `[NB 550]`) that auto-fill the brand, model name, category, and typical price with one click.
- **Inline Photo Swapper**: Hovering over any shoe thumbnail displays a small camera/upload icon to instantly drop or pick a new photo for that shoe.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Provide Both Rollback and Rapid Editing**:
  - *Chosen Approach*: Give the admin both choices directly in the UI. If the 52 products are too scrambled to salvage, a single "Rollback Import Batch" wipes them in seconds. If the admin wants to keep some or all, the Rapid Aligner makes editing 10x faster than standard forms.
  - *Why*: Gives total control to the user without making assumptions about whether the uploaded photos should be discarded or preserved.
- **Decision 2: Interactive Visual Grouping Before AI Analysis**:
  - *Chosen Approach*: Show uploaded photos on a grouping workbench where shots of the same shoe are visibly linked together with "Link / Merge Angle" buttons.
  - *Why*: Machine learning alone cannot reliably know whether two black sneaker shots are the same model or two different pairs; human-in-the-loop visual grouping ensures 100% accuracy every time.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Admin Dashboard (/admin)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Batch Rollback  │      │  Rapid Aligner   │      │ Visual Grouping  │
│  • Firestore     │      │  • Inline Table  │      │  • Multi-angle   │
│    writeBatch    │      │  • Quick Chips   │      │    workbench     │
│  • Tag 'batchId' │      │  • Image Swapper │      │  • Drag & merge  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

- **Batch Identification**: All products created via mass import are tagged with an `importBatchId` (e.g., `batch_20261030_...`), enabling atomic 1-click batch deletion.
- **Firestore Batch Deletes**: Uses chunked `writeBatch` (up to 400 deletes per atomic write) to safely remove all selected documents without hitting document limits.
- **State Management**: Local optimistic updates in `StoreContext` ensure inline edits reflect instantaneously without page flickering.
