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
