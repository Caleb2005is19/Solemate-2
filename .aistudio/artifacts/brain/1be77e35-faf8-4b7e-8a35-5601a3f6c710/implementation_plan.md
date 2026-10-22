# Implementation Plan - Order Sorting Across Customer Portal & Admin Dashboard

Provide a comprehensive, intuitive, and responsive order sorting experience across the store so that both customers and administrators can quickly organize, inspect, and prioritize orders.

---

## 1. Overview & Objectives

Currently:
- **Customer Portal (`Profile.tsx` / `MyOrders.tsx`)**: Has search by order ID / sneaker name and status tabs, but lacks order sorting controls (customers cannot sort by newest/oldest, highest/lowest price, or delivery stage).
- **Admin Dashboard (`OrdersTab.tsx`)**: Has column header sorting and a dropdown, but lacks quick-filter sort pills, fulfillment priority sorting, and visual sort chips.

We will implement a unified sorting engine with clear controls, responsive UI, and persistent preference.

---

## 2. Proposed Features & Changes

### A. Customer Portal Order Sorting (`src/pages/Profile.tsx`)
1. **Sort State & Options**:
   - `newest`: Date: Newest First (Default)
   - `oldest`: Date: Oldest First
   - `price-desc`: Amount: Highest First
   - `price-asc`: Amount: Lowest First
   - `status`: Delivery Progress / Stage (Pending -> Processing -> Shipped -> Delivered -> Cancelled)
   - `items-desc`: Most Items First
2. **Interactive UI Controls**:
   - Add a styled sort dropdown menu next to the search bar and status filters.
   - Add quick sort chips/buttons for one-tap mobile sorting (e.g., "Newest", "Highest Price", "In Transit").
   - Display active sort badge and a "Reset filters" button when non-default sort or search is applied.
3. **Smooth Client-Side Sorting**:
   - Integrate sorting into `useMemo` alongside search query and status filters.
   - Maintain animated layout transitions with Framer Motion when sort criteria change.

### B. Admin Dashboard Enhancements (`src/components/admin/OrdersTab.tsx`)
1. **Quick-Access Sort Pills**:
   - Add top-row quick pills for instant operational sorting:
     - ⚡ **Recent First** (Date ↓)
     - 💰 **High Value** (Total ↓)
     - ⚠️ **Action Needed** (Pending/Processing priority)
     - 👤 **Customer Name** (A-Z)
2. **Fulfillment Priority Sort**:
   - Add an intelligent "Fulfillment Priority" sort option that groups actionable orders (`Pending` & `Processing`) at the top, sorted by oldest order date first, to ensure prompt order processing.
3. **Visual Header Badges**:
   - Enhance table column headers with ascending/descending arrows and highlighted active states.

---

## 3. User Review Required

> [!NOTE]
> Default sorting will remain **"Newest First"** so that recent orders always show up immediately upon opening the page, with all other sorting presets available on demand.

---

## 4. Verification Plan

### Automated Verification
- Run `lint_applet` to check for syntax and TypeScript errors.
- Run `compile_applet` to verify zero build errors.

### Manual / Browser Verification
- Open the Customer Portal (`/profile?tab=orders` or `/orders`), switch sorting between Newest, Oldest, Highest Amount, and Delivery Stage, and verify list reorders instantly.
- Test combining search queries with sorting.
- Open Admin Dashboard (`/admin`), test sorting with column headers, dropdown presets, and quick pills.
- Verify responsive layout on mobile and desktop viewports.
