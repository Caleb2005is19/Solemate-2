# Implementation Plan - Ad & Promo Engine with Social Campaign Toolkit & SEO

Make Solemate Kenya the easiest and most effective platform to run sales promotions, social media ad campaigns, and SEO-boosted deals across the storefront and admin center.

---

## 1. Overview & Objectives

Empower store administrators to create, schedule, and track high-converting promotions without coding, while giving shoppers high-impact, non-intrusive promo touchpoints and generating optimized ad collateral for social media (Instagram, TikTok, WhatsApp, Meta Ads).

### Key Pillars:
1. **Unified Admin Promo & Ad Hub**: An all-in-one campaign manager consolidating banners, countdown timers, coupon discounts, and featured product cards with start/end scheduling.
2. **Social Media Ad Toolkit & UTM Generator**: Instant generation of trackable campaign links, UTM parameters, social ad copy templates (WhatsApp broadcast, Instagram captions, TikTok hooks), and quick-share actions.
3. **Featured Product Promo Cards**: Seamlessly weave stylish campaign promo cards directly into the Homepage and `/shop` catalog grids (e.g. "Weekend Jordan Drop", "Buy 2 Get Free Nairobi Delivery", "Flash 20% Off").
4. **Promo SEO & OpenGraph Cards**: Schema.org `SaleEvent` and `SpecialAnnouncement` structured data plus dynamic social share preview tags for search engines and social platforms.
5. **High-Converting Customer Touchpoints**: Slim sticky header banner with countdown, one-tap coupon copying, and cart drawer free delivery reward progress bar.

---

## 2. Architecture & Component Blueprint

```
                      ┌────────────────────────────────────────┐
                      │        Admin Dashboard (/admin)        │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
       ┌─────────▼──────────────┐                    ┌───────────▼───────────┐
       │   Ad & Promo Hub Tab   │                    │  Social Media Toolkit │
       │  (Campaigns, Timers,   │                    │ (UTM Builder, Ad Copy │
       │  Featured Promo Cards) │                    │ WhatsApp Share Links) │
       └─────────┬──────────────┘                    └───────────┬───────────┘
                 │                                               │
                 ├───────────────────────┬───────────────────────┤
                 │                       │                       │
       ┌─────────▼───────────┐ ┌─────────▼───────────┐ ┌─────────▼───────────┐
       │ Storefront Grid     │ │ Sticky Promo Bar    │ │ Promo SEO & OG      │
       │ Featured Ad Cards   │ │ Top countdown banner│ │ Structured data     │
       │ on Homepage & /shop │ │ & 1-tap coupon copy │ │ JSON-LD & OG tags   │
       └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

---

## 3. Detailed Proposed Features

### A. Admin Ad & Promo Hub (`src/components/admin/MarketingTab.tsx` & new `PromoCampaignsTab.tsx`)
1. **Campaign Manager**:
   - Create unified campaigns that combine:
     - **Campaign Headline & Subtitle** (e.g., "Mega Sneaker Weekend", "Save 20% on Air Max")
     - **Promo Type**: Featured Grid Card, Sticky Header Banner, or Cart Reward
     - **Coupon Integration**: Link directly to a coupon code (or create one automatically)
     - **Countdown Timer**: 24h Flash Sale, Weekend Drop, or custom end date/time
     - **Featured Media**: Upload or select sneaker banner imagery with Cloudinary
     - **Placement**: Homepage grid, Shop page grid, Sticky top banner, or All
2. **Calendar & Scheduling**:
   - Start Date & End Date pickers with timezone alignment (EAT / Nairobi).
   - Real-time status indicators: `Scheduled`, `Live / Active`, `Expired`, `Paused`.
   - One-click duplicate and toggle pause/resume.
3. **Quick Presets (1-Click Launch)**:
   - ⚡ **24-Hour Flash Sale**: 15% off site-wide + urgent countdown
   - 👟 **New Drop Spotlight**: Highlight latest arrivals with limited stock alert
   - 🚚 **Free Nairobi Delivery Weekend**: Zero delivery fees on orders above KES 5,000
   - 🎁 **Buy 2 Sneaker Bundle**: Multi-item discount promo

---

### B. Social Media Ad Toolkit & UTM Generator (`src/components/admin/SocialAdToolkit.tsx`)
1. **Smart Link & UTM Builder**:
   - Choose target page (Home, Specific Sneaker, Men's, Women's, Sale).
   - Attach campaign UTM parameters (`utm_source`: `instagram` | `tiktok` | `whatsapp` | `facebook` | `google`, `utm_campaign`, `utm_medium`).
   - Copy short, clean trackable URL with 1 click.
2. **Ready-to-Post Ad Copy Templates**:
   - **WhatsApp Status & Broadcast**: Formatted with bold highlights and emojis tailored to the Kenyan sneaker audience (M-Pesa payment prompt, Nairobi delivery note).
   - **Instagram / Facebook Caption**: High-engagement copy with hashtags (`#SneakersKenya`, `#SolemateKE`, `#NairobiStreetwear`).
   - **TikTok Ad / Video Script Hook**: 3-second hook ideas and caption text.
3. **One-Tap WhatsApp Broadcast**:
   - Direct button `Send to WhatsApp` that opens `https://wa.me/?text=...` with preformatted copy and link ready to blast to VIP customer lists or status.

---

### C. Featured Product Promo Cards on Homepage & Shop Grid
1. **Grid Integration (`src/pages/Shop.tsx` & `src/pages/Home.tsx`)**:
   - Seamlessly insert high-impact promo cards within the sneaker product grid (e.g., after every 6th or 8th product).
   - Card displays:
     - High-fashion sneaker banner image
     - Punchy promo title & discount badge
     - Real-time countdown timer if active
     - One-click "Apply Code" or "Shop Drop" action button
   - Zero-pill styling with clean typography and dark slate/orange palette.

---

### D. Storefront Customer Touchpoints
1. **Sticky Top Promo Banner**:
   - Slim, non-intrusive banner (`< 40px`) with countdown timer, promo discount, and copy coupon button.
   - Dismissible with session memory.
2. **Cart Drawer Promo Threshold**:
   - Dynamic progress bar: *"Add KES X more for Free Nairobi Delivery!"*
   - Instant coupon code input with live discount calculation.

---

### E. SEO & Social Share Metadata (`applet-seo`)
1. **Dynamic OpenGraph Tags**:
   - Update `og:title`, `og:description`, and `og:image` when an active major campaign is running, ensuring shared links display sale banners on WhatsApp, iMessage, and Twitter.
2. **Schema.org SaleEvent & Offer JSON-LD**:
   - Inject structured data into the page head so Google Search indexes ongoing discounts, active promotion dates, and promotional pricing.

---

## 4. Verification & Testing Plan

### Automated Verification:
- **Type Checking**: Run `npm run lint` / `lint_applet` to ensure TypeScript compiles without errors.
- **Production Build**: Run `npm run build` / `compile_applet` to verify clean bundle compilation.

### Manual / Browser Verification:
1. **Admin Campaign Hub**:
   - Create a campaign in the Admin Center with a countdown timer, coupon code, and target placement.
   - Verify live toggle, scheduling dates, and preset templates.
2. **Social Media Toolkit**:
   - Generate a WhatsApp promo link and an Instagram UTM link.
   - Verify generated URLs resolve properly on the storefront with coupon auto-fill.
3. **Storefront Product Grids**:
   - Open `/shop` and `/` and verify the featured promo card appears seamlessly among sneaker products.
   - Test responsive layout on mobile, tablet, and desktop.
4. **Sticky Banner & Countdown**:
   - Verify the countdown ticks accurately and the coupon copies cleanly to clipboard.
5. **SEO & Social Preview**:
   - Inspect `<head>` tags to verify `og:title`, `og:description`, and `Schema.org` `SaleEvent` JSON-LD output.
