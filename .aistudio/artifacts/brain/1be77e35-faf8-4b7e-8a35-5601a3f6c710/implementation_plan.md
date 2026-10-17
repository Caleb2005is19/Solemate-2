# Sales Reports & Seller Analytics Generator

A comprehensive sales reporting hub for store administrators and sellers to effortlessly analyze revenue, filter performance across customizable date ranges and categories, and export professional CSV spreadsheets and PDF summary reports with one click.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed preferences in Phase 1, the reporting suite will deliver both **CSV spreadsheet downloads** and **downloadable PDF reports**, equipped with multi-dimensional filtering across **Date Ranges**, **Top Products**, **Product Categories**, and **Payment/Order Status**, featuring both a **dedicated Sales Reports tab** in the admin sidebar and **per-seller report breakdowns**.

- **Confirmed Decision 1 (Export Formats)**: Both raw CSV spreadsheet export (for Excel/Google Sheets accounting) and formatted downloadable PDF reports (using `@react-pdf/renderer` with store branding and summary tables).
- **Confirmed Decision 2 (Metrics & Breakdowns)**: Date ranges (Today, 7 Days, 30 Days, This Month, Year to Date, Custom Date Range), revenue and order counts by payment status (Paid, Pending, Failed), category volume shares, top-performing products, and seller earnings.
- **Confirmed Decision 3 (Navigation & Accessibility)**: A dedicated `Sales Reports` navigation item in the Admin Dashboard sidebar with a universal filter bar, plus quick "View Sales Report" shortcuts inside the Sellers tab and seller views.

---

## 1. Overview & Core Concept

- **What It Does**: Provides store managers and vendor partners with a zero-friction reporting interface to inspect gross merchandise value (GMV), net revenue, order volume, average order value (AOV), and payment success rates. Users can slice data by timeframe, category, payment status, or specific vendor, and immediately export either an audit-ready CSV spreadsheet or a styled, printable PDF report.
- **Target Audience / Persona**: Store administrators, accounting and fulfillment staff, and marketplace sellers needing fast sales insights without technical friction or manual spreadsheet tallying.
- **Key Value**: Replaces tedious manual order scanning with instant visual breakdowns and one-click report exports for bookkeeping, tax compliance, vendor payouts, and inventory forecasting.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Viewing Sales Health & Quick Presets**:
   - The user opens the **Sales Reports** tab from the admin navigation bar.
   - At the top, a clean preset selector allows one-click filtering by **Today**, **Last 7 Days**, **Last 30 Days**, **This Month**, **Year to Date**, or a **Custom Date Range**.
   - Four core KPI tiles display **Total Sales Volume**, **Completed Revenue**, **Average Order Value**, and **Pending/Unsettled Amount** using clear tabular numerals.

2. **Drilling Down by Category, Status, or Seller**:
   - An interactive filter bar allows narrowing results by **Payment Status** (All, Paid / Completed, Pending, Cancelled / Refunded), **Product Category** (Sneakers, Boots, Loafers, etc.), and **Seller / Vendor** (All Sellers or a specific vendor account).
   - Dynamic charts visualize sales trends over time, category revenue share, and a ranking table of top 5 best-selling items by revenue and units.

3. **Generating & Exporting Reports**:
   - **Download CSV**: Instantly formats all filtered transaction rows with Order ID, Date, Customer Name, Phone, Items Sold, Category, Seller, Subtotal, Discount, Delivery Fee, Total, and Payment Status into a standard CSV file.
   - **Download PDF Report**: Generates a branded executive summary document including store header, reporting timeframe, KPI highlights, category breakdown table, seller commission summary, and top products table.
   - **Per-Seller Direct Access**: On the Sellers management tab, each seller card features a direct **"Generate Sales Report"** button that pre-filters the report generator to that specific seller's items and payout balance.

### Visual Identity & Theme

- **Aesthetic Direction**: High-density, utilitarian SaaS dashboard complying with the Universal Frontend Design Constitution. Flat surfaces, hairline borders (`border-zinc-200 dark:border-zinc-800`), clean typography, and zero-pill metadata discipline.
- **Color Palette & Mood**:
  - Dominant Neutral Canvas: Crisp white (`#FFFFFF`) / dark slate (`#09090B`)
  - Structural Surfaces: Subtle gray panels (`bg-zinc-50 dark:bg-zinc-900`)
  - Semantic Status Tokens: Emerald (`#10B981`) for completed/paid, Amber (`#F59E0B`) for pending, Rose (`#EF4444`) for cancelled/failed
  - Brand Accent: High-intent warm orange (`#F97316`) reserved strictly for active tab states and primary export buttons
- **Typography & Hierarchy**:
  - Headings: `font-bold tracking-tight text-zinc-900`
  - Body & Labels: `font-medium text-zinc-600`
  - Data, Timestamps & Currency: `font-mono tabular-nums` for precise alignment
  - Metadata: Clean unboxed text separated by `·` or `/` without pill containers
- **Component Styling & Layout**:
  - Clean 3-zone layout: Filter & Preset Bar $\to$ KPI Summary Grid $\to$ Breakdown Grids & Transaction Data Table
  - Tabular rows with generous hit targets, subtle hover backgrounds, and sticky export action buttons

### Interactive Feedback & Motion

- Smooth transitions ($\le 200\text{ms}$) on preset filter clicks with zero layout shift.
- Export buttons show animated loading spinners during PDF rendering and CSV generation.
- Empty states provide actionable guidance when no transactions match the selected date range.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Dynamic Aggregation vs. Server Query Endpoints**
  - *Chosen Approach*: Leverage existing real-time Firestore order synchronization from `StoreContext` to compute report aggregations client-side with fallback support for server-side exports.
  - *Why*: Instantaneous filter response without API roundtrips; admins can rapidly toggle dates and sellers without loading lag.
  - *Alternatives Considered*: Separate backend report generation endpoints. While useful for massive datasets, the store's current order volume performs faster and smoother with reactive client computations.

- **Decision 2: PDF Generation Architecture (`@react-pdf/renderer`)**
  - *Chosen Approach*: Dedicated `SalesReportPdfDocument.tsx` utilizing `@react-pdf/renderer` already present in the workspace dependencies.
  - *Why*: Produces pristine vector PDFs formatted specifically for print or digital sharing with page numbers, store contact metadata (wired to `siteSettings`), and clean data tables.
  - *Alternatives Considered*: Browser `window.print()` only. Rejected because browser print dialogs are inconsistent, include unwanted browser headers/footers, and cannot be saved silently as an email attachment.

- **Decision 3: Dedicated Reports Tab + Seller Quick-Actions**
  - *Chosen Approach*: Add `sales-reports` as a primary navigation item in the Admin Dashboard sidebar, and wire a "View Sales Report" shortcut on each seller item in the `sellers` tab.
  - *Why*: Meets the user's explicit preference for both centralized reports and seller-level reporting in the admin bar.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Admin Dashboard Navigation                       │
│      [Overview] [Products] [Orders] [Sellers] [Sales Reports] ★        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     SalesReportsTab (New Component)                    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Date Presets: [Today] [7D] [30D] [This Month] [Custom Range]    │  │
│  │ Secondary Filters: [Seller: All/Specific] [Category] [Status]    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌───────────────────┬───────────────────┬──────────────────────────┐  │
│  │ Gross Revenue     │ Net Paid Revenue  │ Avg Order Value (AOV)   │  │
│  │ KES 485,200       │ KES 412,000       │ KES 4,850               │  │
│  └───────────────────┴───────────────────┴──────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────┬────────────────────────────────┐  │
│  │ Revenue Trend (Recharts Area)   │ Category Share & Status Split  │  │
│  └─────────────────────────────────┴────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Top Selling Products (Units Sold, Revenue Contribution, Stock)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Export Bar: [Download CSV Spreadsheet] [Download PDF Summary]    │  │
│  └───────────────────┬───────────────────────────┬──────────────────┘  │
└──────────────────────┼───────────────────────────┼─────────────────────┘
                       │                           │
                       ▼                           ▼
        ┌─────────────────────────────┐   ┌──────────────────────────────┐
        │ reportCsvExporter.ts        │   │ SalesReportPdfDocument.tsx   │
        │ - RFC 4180 CSV builder      │   │ - Vector PDF Document        │
        │ - Browser Blob auto-trigger │   │ - Branded Header & Summary   │
        │ - Line item detail support  │   │ - Category & Seller Breakouts│
        └─────────────────────────────┘   └──────────────────────────────┘
```

### Data Model & State

- **Input State**: `orders`, `products`, `sellers`, and `siteSettings` from `useStore()`.
- **Report Filter State**:
  - `datePreset`: `'today' | '7d' | '30d' | 'this_month' | 'custom'`
  - `startDate`: `string (YYYY-MM-DD)`
  - `endDate`: `string (YYYY-MM-DD)`
  - `selectedSellerId`: `string ('all' | sellerId)`
  - `selectedCategory`: `string ('all' | category)`
  - `selectedStatus`: `string ('all' | 'Paid' | 'Pending' | 'Cancelled')`
- **Computed Metrics**:
  - `totalRevenue`: Sum of order totals for non-cancelled orders.
  - `paidRevenue`: Sum of order totals where status is `'Paid'` or `'Delivered'`.
  - `pendingRevenue`: Sum of order totals where status is `'Pending'`.
  - `totalOrders`: Count of matching orders.
  - `avgOrderValue`: `totalRevenue / totalOrders`.
  - `categoryBreakdown`: Volume and revenue grouped by item category.
  - `topProducts`: Ranked list of products by units sold and revenue.
  - `sellerBreakdown`: Revenue and commission attributed to each vendor.

### Interactive Component & State Mapping

- `Dashboard.tsx`: Register `sales-reports` tab in sidebar with `TrendingUp` or `BarChart3` icon; render `SalesReportsTab` when active; pass seller pre-selection when triggered from `Sellers` tab.
- `src/components/admin/SalesReportsTab.tsx`: Houses the filter bar, KPI summary cards, Recharts trend graph, breakdown tables, and export triggers.
- `src/utils/reportCsvExporter.ts`: Pure utility function to convert filtered orders and summary metrics into an RFC 4180 compliant CSV file with dynamic filename (e.g., `sales-report-2026-10-16.csv`).
- `src/components/admin/SalesReportPdfDocument.tsx`: PDF document template utilizing `@react-pdf/renderer` for high-resolution downloadable summaries.
- `src/components/admin/OverviewTab.tsx`: Add a quick shortcut link "View Detailed Sales Report $\to$" to seamlessly transition to the reports tab.
