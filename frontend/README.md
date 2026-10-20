# JanMithra Frontend

> **Accessible, Multilingual, Mobile-First Agricultural Advisory & Scheme Discovery UI**  
> Built for Indian farmers, smallholders, and rural communities.

Aligned with the [JanMithra GitHub Repository](https://github.com/YaswanthKomminni/JanMitra-AI-Powered-Government-Scheme-Assistant) and Elsevier Base Paper *"AI-based agricultural chatbots for sustainable farming: A systematic review"*.

---

## 🌟 Key Features

### 1. Rural-First Accessibility & Tactile UX
- **High-Contrast Palette:** Vivid Emerald Greens (`#059669`), warm subsidy Ambers (`#d97706`), and clean backgrounds.
- **Large Touch Targets:** 48px+ touch buttons and a dedicated on-screen numeric keypad for mobile-number entry, designed for one-handed outdoor use.
- **Minimal Textual Density:** Visual badges, icons, and clear match percentages.

### 2. 6-Language Multilingual Support (i18n)
Full native translations and script rendering for:
- 🌐 **English**
- 🇮🇳 **हिन्दी (Hindi)**
- 🌾 **తెలుగు (Telugu)**
- 🌱 **தமிழ் (Tamil)**
- 🌿 **ಕನ್ನಡ (Kannada)**
- 🍃 **বাংলা (Bengali)**

### 3. Voice-First Interaction (Speech-to-Text & Text-to-Speech)
- **Push-to-Talk Microphone:** Native Web Speech API integration (`SpeechRecognition`) with regional BCP-47 locale detection (`te-IN`, `hi-IN`, `ta-IN`, etc.).
- **Audio Readout (TTS):** Every AI advisory message includes an "Audio Read Out / Listen" speaker button to speak answers aloud in the farmer's native dialect.

### 4. Grounded AI Scheme Recommendations
- **Personalized Match Score:** Instant ranking (e.g. `98% Match`) based on land acreage, soil classification, irrigation infrastructure, and state/district.
- **Key Schemes Included:**
  - **PM-KUSUM Component-B:** 60% Solar Agricultural Pump Subsidy
  - **PM-KISAN:** ₹6,000/year direct financial support
  - **PMFBY:** Crop Loss Insurance with 1.5% premium
  - **Soil Health Card Scheme:** 100% Free soil testing & custom NPK advice
  - **Kisan Credit Card (KCC):** Low-interest (4%) cultivation loans

### 5. Nearby Peer Success Stories (PostGIS 25km Spatial Matching)
- Displays nearby farmers who successfully claimed subsidies or installed equipment within 5km, 10km, or 25km radius.
- Shows matched land type, real crop yield increase, and fuel/fertilizer cost savings.
- **"Call Peer Farmer"** modal with verified contact sharing for peer-to-peer verification.

### 6. Document & Land Verification Modal (Llama 3.2 Vision OCR)
- Drag-and-drop or camera photo upload for:
  1. **Land Records (Pahani / Patta / 7/12 / RoR)**
  2. **Soil Health Cards (pH, Nitrogen, Phosphorus, Potassium)**
  3. **Crop Leaf Disease Photos (Pest detection)**
- Built-in 1-click test presets for instant evaluation.
- Live laser-beam scanning animation and structured entity extraction inspector.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

> **Database & accounts:** JanMithra needs PostgreSQL for sign-up, sign-in and saved conversations.
> Copy `.env.example` to `.env.local`, set `DATABASE_URL`, then run `npm run db:setup` (creates the database if missing and applies migrations) or `npm run db:migrate` (database already exists).
> See the root README section *Running JanMithra* for details.

### 2. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css          # Custom animations, wave bars, accessible focus
│   │   ├── layout.tsx           # Mobile-first viewport, meta tags, font setup
│   │   └── page.tsx             # Main orchestrator dashboard & view switcher
│   ├── components/
│   │   ├── Navbar.tsx           # Brand, language dropdown, helpline, farmer profile
│   │   ├── AuthModal.tsx        # Sign-in / sign-up modal (shared AuthForm, mobile + password)
│   │   ├── DashboardHeader.tsx  # GPS live status & high-contrast land profile badge
│   │   ├── SchemeCard.tsx       # Match score, subsidy tag, documents checklist
│   │   ├── SchemeDetailModal.tsx# Guidelines, eligibility, CSC center locator
│   │   ├── PeerNetwork.tsx      # PostGIS 25km nearby farmer network cards
│   │   ├── ChatAssistant.tsx    # Multimodal voice chat & dynamic clarification chips
│   │   └── DocumentVerificationModal.tsx # Llama 3.2 Vision OCR scanner simulation
│   ├── lib/
│   │   ├── i18n.ts              # 6-Language translation dictionary
│   │   ├── mockData.ts          # Farmers, schemes, peer stories, OCR presets
│   │   └── speech.ts            # Web Speech API (STT & TTS) engine
│   └── store/
│       └── useFarmerStore.ts    # Central Zustand state management
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## Document and image AI

Government welfare notices (including pensions and scholarships), agricultural admissions/recruitment, land records, KYC and crop photos are supported. A portrait printed on an ID card, hands holding a notice, or a document displayed on a screen does not make the document irrelevant.

Configure at least one server-side provider key in `.env.local` for multimodal reasoning and full translated responses: `GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY`. Optional text/vision model overrides are listed in `.env.example`. Defaults were checked against the Google and Groq model catalogs on 2026-10-20; deployments can override these as availability changes. Restart the app after changing settings.

Cloud attempts share bounded deadlines and fall back to literal local extraction. Without a cloud key, readable images use Tesseract, searchable PDFs use PDF text extraction, and plain text is read directly. English and Telugu language data ship as dependencies. OCR rotates and enlarges images, improves contrast, and tries sparse text segmentation for scheme posters. Set `OCR_LANGUAGES` and `OCR_LANG_PATH` for additional installed language packs. Local extraction preserves source wording; it is not a substitute for a multilingual generative model. Scanned PDFs need Gemini vision or a clear image of each page. Other unsupported or unreadable formats request clearer input instead of inventing a summary or rejecting them as selfies.

A local quantized CLIP model compares image content against agricultural, document, and unrelated scene categories when OCR cannot establish relevance. Only confidently unrelated scenes are rejected; ambiguous images remain uncertain. This is scene classification, not a disease diagnosis. The model does not infer eligibility or document authenticity. Browser and camera previews remain pending until server analysis finishes. Local document text can override a mistaken model rejection. Uncertain uploads are not recorded as successful analyses. Document follow-up context comes from the current conversation's analyzed attachment, retaining the extracted text and structured facts. Local fallback lists schemes explicitly mentioned in the source; it does not declare eligibility.

Run `npm run test:ai` for isolated AI regression tests (no database or cloud keys needed). To include a real-image OCR check in PowerShell:

```powershell
$env:TEST_REAL_OCR = '1'
npm run test:ai
```

The optional `TEST_OCR_FILE` environment variable selects another image. This OCR check uses the packaged language data. `TEST_ROOM_IMAGE` and `TEST_POSTER_IMAGE` enable optional integration checks using local image files; screenshots and private test inputs are not included in the repository. `npm run typecheck` and `npm run build` validate the application. The separate `test:api` suite requires a running app and configured PostgreSQL database.

The build prepares the approximately 154 MB quantized model from `Xenova/clip-vit-base-patch32` on Hugging Face and stores it in `frontend/models` (ignored by Git). Runtime requests read local model files and need no Hugging Face token or download. Keep this directory and the OCR packages in the deployment. The first build needs network access and can take several minutes; interrupted downloads can resume. `VISION_MODEL_PATH` may point to another local model root. Budget server memory for the model plus OCR workers; use a cloud vision provider if the hosting plan cannot run local inference reliably.
