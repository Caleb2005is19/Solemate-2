# Grounded Visual Sneaker Authenticator & Photo Un-grouping Suite

Replace all speculative guessing and random fallback naming with a strict, 100% visually-grounded shoe identification engine that extracts visible brand logos, box text, and exact silhouettes—accompanied by visible proof explaining why the model was identified—alongside 1-click photo detachment and gallery editing.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Zero-Hallucination & Anti-Guessing Guarantee**:
> - **Total Ban on Blind Fallbacks**: We are completely eliminating the static rotating catalogue that previously assigned random names like "Air Jordan 4" or "Nike Dunk" to unrelated photos.
> - **Visual Evidence & Logo Grounding**: Gemini Vision will be instructed under a strict authentication protocol to look for visible logos (Nike Swoosh, Jordan Jumpman, Adidas Three Stripes, Timberland tree emblem, New Balance 'N'), visible box branding (e.g., "Timberland" printed on the box in the background), and distinctive panel cuts.
> - **Visible Proof & Confidence**: Every recommendation will display a **Confidence Score** and **Visual Evidence Summary** (e.g., *"Detected Timberland tree logo on leather quarter and Timberland branding on shoebox"*), so you can verify that the AI is actually reading the photo rather than making up a name.
> - **Honest Fallback**: If an image is too blurry or obscure to recognize with certainty, the AI will honestly declare *"Unverified Model"* and suggest a generic descriptive label based only on what is visible (e.g., *"Black Leather Low-Top Sneaker"*), never a fake hype sneaker name.

---

## 1. Overview & Core Concept

- **What It Does**:
  - **100% Grounded Footwear Identification**: Inspects shoe photos for visible emblems, tags, shoebox text, and sole designs to identify genuine models without guessing or hallucinating.
  - **Visual Proof Explanation**: Every detection is paired with a plain-English explanation of the visual markers found in the image.
  - **Interactive Side-by-Side Review**: Nothing is ever overwritten automatically. You see the photo, the current name, the detected model, the confidence level, and the visual proof before choosing to accept or keep.
  - **Interactive Photo Un-grouping**: For products with multiple photos, you can view the full gallery tray and either:
    1. **Detach photo into its own new product** (saving the photo as an independent shoe listing).
    2. **Delete misgrouped photos** with 1 click.
    3. **Promote any angle to the main hero image**.
- **Target Audience / Persona**: Store administrators on Solemate.co.ke requiring verified, authentic product listings.
- **Key Value**: Guarantees zero false hype names, eliminates hours of manual data entry, and gives complete control over photo groupings.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ Shoe Card in Aligner / Edit Modal ]
       │
       ├──► [ View Photo Gallery Tray ]
       │         │
       │         ├──► [ Detach to New Product ] ──► Creates Separate Shoe Record with This Photo
       │         ├──► [ Delete Misgrouped Photo ] ──► Removed from This Shoe Gallery
       │         └──► [ Make Primary Hero Photo ] ──► Swaps Main Image
       │
       └──► Click "AI Grounded Authenticate"
                 │
                 ▼
       ┌─────────────────────────────────────────────────────────────────┐
       │             Grounded Footwear Verification Review               │
       ├─────────────────────────────────┬───────────────────────────────┤
       │ CURRENT METADATA                │ AI VERIFIED FROM PHOTO        │
       │ Name: Air Jordan 4 Retro        │ Name: Timberland Adventure 2.0│
       │ Brand: Nike (Wrong)             │ Brand: Timberland (Verified)  │
       │                                 │ Confidence: 96% (High)        │
       ├─────────────────────────────────┴───────────────────────────────┤
       │ Visual Evidence Found in Photo:                                 │
       │ • "Timberland tree logo embossed on outer leather quarter"      │
       │ • "Original kraft shoebox in background marked 'Timberland'"    │
       │ • "White cupsole with embossed Timberland signature on tread"   │
       ├─────────────────────────────────────────────────────────────────┤
       │             [ Keep Current ]         [ Accept Verified Match ]  │
       └─────────────────────────────────────────────────────────────────┘
```

### Visual Identity & Theme
- **Confidence Badges**: Clean unboxed status markers:
  - `Verified Match (High Confidence)` with subtle emerald text.
  - `Close Match (Medium Confidence)` with subtle amber text.
  - `Unverified (Needs Manual Input)` with subtle slate text.
- **Visual Evidence Callout**: Quiet slate callout box showing bulleted visual markers detected by the vision model.
- **Photo Tray Controls**: Floating mini-action buttons on each gallery thumbnail with tooltips (`Detach to New Shoe`, `Set as Hero`, `Delete Photo`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Elimination of Static Rotational Fallback Engine**:
  - *Chosen Approach*: Completely remove the static array of 12 hype sneakers (`TRENDING_CATALOGUE`) that rotated blindly through indices.
  - *Why*: The rotational fallback was the direct cause of Timberlands and other shoes receiving "Air Jordan 4" or "Nike Dunk" names. If an AI call fails, the system must clearly notify the user rather than guessing random models.
- **Decision 2: Strict Multimodal Authenticator System Instructions**:
  - *Chosen Approach*: Explicitly instruct Gemini 3.8 Flash to act as a certified sneaker authenticator. Mandate visual proof referencing visible logos, box markings, and silhouettes.
  - *Why*: Forces the vision model to ground its response in actual pixels rather than general trend heuristics.
- **Decision 3: Two-Click Safety Barrier**:
  - *Chosen Approach*: All AI alignments require clicking "Accept Verified Match" in a side-by-side comparison modal; zero silent mutations.
  - *Why*: Gives the admin 100% confidence and oversight over every product in the store.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Admin UI Clients                                │
│       Quick Visual Aligner       │       Edit Product Modal            │
└───────────────────┬──────────────┴────────────────────┬────────────────┘
                    │                                   │
                    ▼                                   ▼
       ┌────────────────────────┐          ┌──────────────────────────┐
       │   Gallery Operations   │          │   POST /api/catalog/     │
       │  • Detach Photo        │          │      ai-align-shoe       │
       │  • Delete Photo        │          │   (Grounded Vision)      │
       │  • Make Hero Image     │          └────────────┬─────────────┘
       └────────────┬───────────┘                       │
                    │                                   ▼
                    ▼                      ┌──────────────────────────┐
       ┌────────────────────────┐          │ Visual Evidence &        │
       │   Firestore writeBatch │          │ Confidence Verification  │
       └────────────────────────┘          └──────────────────────────┘
```

- **Backend Endpoint (`/api/catalog/ai-align-shoe`)**:
  - Receives `{ imageUrl, base64, currentName }`.
  - Prompts `gemini-3.8-flash` with image inlineData and strict verification guidelines.
  - Returns structured JSON:
    ```json
    {
      "success": true,
      "detected": {
        "name": "Timberland Adventure 2.0 Cupsole Sneaker",
        "brand": "Timberland",
        "category": "Lifestyle",
        "gender": "Men",
        "color": "Black Leather / White Sole",
        "price": 9500,
        "originalPrice": 12000,
        "description": "Crafted with premium full-grain leather and supportive cupsole traction. Features the iconic Timberland tree logo.",
        "confidence": "High",
        "visualEvidence": [
          "Timberland tree logo clearly visible on outer leather quarter",
          "Kraft shoebox in background displays Timberland typography",
          "White rubber cupsole matches classic Timberland cupsole silhouette"
        ]
      }
    }
    ```
- **Detach Operation**:
  - Takes a gallery photo URL from a parent product.
  - Removes that URL from the parent product's `images[]`.
  - Creates a new product document with that photo as its primary `image`, temporary model name (or auto-detected name), and matching seller attribution.
  - Commits both changes in an atomic Firestore batch.
