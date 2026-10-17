# Unified Customer Portal & Enhanced Order Tracking Hub

A premium, modern customer account portal for Solemate shoppers to track their sneaker orders through an interactive fulfillment timeline, manage delivery addresses, set preferred footwear sizes, retry pending M-Pesa payments, and download certified purchase receipts.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the interactive interview and will guide this implementation:
>
> - **Profile & Footwear Personalization**: Customers can manage their personal contact details, default delivery address, and configure their **Preferred Shoe Size** (EU/US/UK size selector) and style preferences for faster checkout.
> - **Rich Order Tracking & Payment Tools**: Every order features an **interactive visual status timeline** (Placed → Paid → Processing → Shipped → Delivered), direct **M-Pesa STK Push retry** & receipt verification for pending orders, and one-click **Solemate.co.ke PDF receipt downloads**.
> - **Unified Account Architecture**: A single, cohesive Customer Portal with responsive navigation tabs for **Orders & Tracking**, **Profile & Sizing**, and **Delivery Addresses**, streamlining both `/profile` and `/my-orders` into one seamless experience.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the existing fragmented customer profile and order pages into a cohesive, high-touch Customer Hub. Shoppers can track order dispatch step-by-step, verify M-Pesa payments directly from their account without contacting support, manage multiple delivery drop-offs (e.g. Home vs. Office), and save their exact shoe size preferences so checkout is pre-filled.
- **Target Audience**: Solemate footwear shoppers, repeat collectors, and customers tracking live sneaker deliveries across Nairobi and Kenya.
- **Key Value**: Reduces customer service inquiries regarding order status and M-Pesa payment clearing; accelerates repeat purchases with pre-saved sizes and one-click re-ordering; delivers a polished luxury retail experience aligned with the Solemate brand.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Order Tracking & Fulfillment Timeline**:
   - The customer opens the Orders tab and sees their orders sorted by newest first.
   - Each order card displays a high-contrast visual progress bar with 4 distinct stages: *Order Placed*, *Payment Confirmed*, *Dispatched for Delivery*, and *Delivered*.
   - If an order is still marked *Pending*, an inline payment assist card offers a one-click *"Retry M-Pesa STK Push"* button and a receipt code verification box.
   - Completed orders offer one-click *"Download PDF Receipt"* and a *"Re-order"* button that adds the exact shoe and size directly back to the shopping bag.

2. **Personal Profile & Shoe Sizing Preferences**:
   - The customer navigates to the *Profile & Sizing* tab.
   - Interactive Shoe Size selector grid (EU 37 to EU 46, US 5 to US 12) allows selecting their primary size and fit preference (Men / Women / Unisex).
   - Personal information form allows updating Display Name, Primary Phone Number, and Secondary WhatsApp Number.
   - Clicking *"Save Profile"* displays an immediate success toast and syncs directly to their Firestore profile.

3. **Saved Delivery Addresses**:
   - Customers can view and edit their primary delivery details (City, Street/Estate, House/Apartment/Office, Landmark notes for dispatch riders).
   - Pre-fills seamlessly during subsequent checkout runs.

### Visual Identity & Theme
- **Color Palette & Accents**:
  - Dominant Neutral Canvas: Crisp white (`#ffffff`) card containers with clean zinc hairline borders (`border-zinc-200`) on subtle off-white backgrounds (`bg-zinc-50`).
  - Brand Accent: Signature Solemate energetic orange (`#f97316`) for active tab pill indicators, primary CTA buttons, and completed timeline steps.
  - Dark Surface Highlights: Premium dark charcoal (`#18181b`) for executive actions (PDF downloads, Re-order buttons).
- **Typography & Layout**:
  - Tabular numerals (`font-mono tabular-nums`) for currency amounts, dates, and order numbers.
  - Clean unboxed metadata separated by typographic dots (`·`).
  - Status indicators paired with descriptive text and icons for full color-blind accessibility.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified Portal with Synchronized URL Routing**
  - *Chosen Approach*: Unify `/profile` and `/my-orders` into a synchronized component architecture where `/my-orders` opens the unified portal pre-selected on the Orders tab, while `/profile` opens on the Profile tab.
  - *Why*: Eliminates code duplication across two separate pages, ensures feature parity, and keeps customer navigation consistent.

- **Decision 2: Embedded Payment Resolution inside Order Cards**
  - *Chosen Approach*: Bring M-Pesa STK Push retry and code verification directly into the order cards for any unpaid orders, rather than forcing the customer back into the checkout flow.
  - *Why*: Reduces cart abandonment and failed order drop-offs when M-Pesa timeouts occur.

- **Decision 3: Shoe Size Preference Storage in Profile**
  - *Chosen Approach*: Store `preferredShoeSize` and `genderPreference` on the `UserProfile` document in Firestore.
  - *Why*: Enables smart checkout pre-selection and personalized shop filtering across future shopping sessions.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Solemate Customer Portal                        │
├────────────────────────────────────────────────────────────────────────┤
│  [ Customer Hero Header ]                                              │
│  Avatar · Customer Name · Member Since · Quick Stats (Orders / Spent)   │
├────────────────────────────────────────────────────────────────────────┤
│  [ Segmented Navigation Tabs ]                                         │
│  ┌───────────────────────┬──────────────────────┬────────────────────┐ │
│  │ 📦 Orders & Tracking  │ 👟 Profile & Sizing  │ 📍 Saved Addresses │ │
│  └───────────────────────┴──────────────────────┴────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  TAB 1: ORDERS & TRACKING                                              │
│  - Status Filter Tabs: All · In Transit · Delivered · Pending          │
│  - Order Cards with:                                                   │
│    * Interactive 4-Stage Visual Fulfillment Timeline                   │
│    * Shoe Items List with Photo, Size, Quantity, Price                 │
│    * Pending M-Pesa STK Push Retry & Receipt Input                     │
│    * One-Click PDF Receipt Download & Native Print                     │
│    * "Buy Again" Quick Re-order Button                                 │
│                                                                        │
│  TAB 2: PROFILE & SHOE SIZING                                          │
│  - Full Name & Email                                                   │
│  - Primary Contact Phone & Secondary Phone                             │
│  - Interactive Sizing Matrix (EU 36 - 47)                              │
│  - Fit Preference (Men / Women / Unisex)                               │
│                                                                        │
│  TAB 3: DELIVERY ADDRESSES                                             │
│  - Primary Delivery City (Nairobi CBD, Westlands, Kilimani, etc.)      │
│  - Physical Street, Estate & House/Apartment                           │
│  - Dispatch Rider Landmark Instructions                                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & State Plan
1. **Types Update (`src/services/types.ts`)**:
   - Extend `UserProfile` to support `preferredShoeSize?: string`, `genderPreference?: string`, and `secondaryPhone?: string`.
2. **Refactor Profile Page (`src/pages/Profile.tsx`)**:
   - Implement the unified portal with reactive tab switching (`orders`, `profile`, `addresses`).
   - Integrate M-Pesa payment query and STK push handler.
   - Embed the Solemate branded visual progress timeline.
3. **Synchronize MyOrders Route (`src/pages/MyOrders.tsx`)**:
   - Align `MyOrders.tsx` to mount the unified customer portal with `initialTab="orders"`.
