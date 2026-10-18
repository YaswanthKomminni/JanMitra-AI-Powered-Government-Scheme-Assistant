# JanMithra: AI-Powered Government Scheme Assistant

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

An accessible, mobile-first, and voice-first conversational AI platform designed to bridge the rural digital divide in India. **JanMithra** empowers farmers, smallholders, and rural citizens to discover personalized government welfare schemes, verify land/soil records with AI Vision OCR, and connect with nearby peer farmers who successfully claimed subsidies.

---

## 🌾 Key Highlights

- **Rural-First UX:** High-contrast emerald/amber palette, 48px+ tactile buttons, and on-screen numeric keypad for OTP entry.
- **Multilingual Support (6 Languages):** Full native translations in **English**, **हिन्दी (Hindi)**, **తెలుగు (Telugu)**, **தமிழ் (Tamil)**, **ಕನ್ನಡ (Kannada)**, and **বাংলা (Bengali)**.
- **Voice Accessibility:** Push-to-Talk Speech-to-Text (STT) and Audio Read-out (TTS) in regional dialects.
- **Personalized Scheme Discovery:** Match scoring based on land size, soil classification, irrigation type, and geographic location (PM-KISAN, PM-KUSUM, PMFBY, Soil Health Cards).
- **PostGIS Peer Network:** Connects farmers with nearby successful peers within 5km, 10km, and 25km radii.
- **Vision OCR Document Verification:** Powered by Llama 3.2 Vision to scan land records (Pahani/Patta), soil health cards, and crop disease photos.

---

## 📁 Repository Structure

```
.
├── frontend/                  # Next.js 14 App Router UI (React, Tailwind, Zustand)
│   ├── src/
│   │   ├── app/               # Next.js routes, layout, global styles
│   │   ├── components/        # Accessible UI components (Navbar, ChatAssistant, Cards, Modals)
│   │   ├── lib/               # i18n dictionary, mock data, speech engine
│   │   └── store/             # Zustand state management
│   ├── package.json
│   └── tailwind.config.ts
├── dataset/                   # Government scheme schemas and conversational NLP queries
│   ├── schemes/               # Structured scheme metadata (JSON & CSV)
│   ├── conversational_nlp/    # Multilingual intent and entity queries
│   └── metadata.json
├── docs/                      # Base paper documentation and research review
├── scripts/                   # Synthetic dataset generators and verification scripts
└── README.md
```

---

## 🚀 Running the Frontend UI

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Authors & Team
- **Komminni Yaswanth** (CB.SC.U4CSE24024)
- **P J Abhiram** (CB.SC.U4CSE24039)
- **S. Sai Sumalik** (CB.SC.U4CSE24647)
- **Vutla Charan** (CB.SC.U4CSE24258)

Faculty Guide: **Dr. T Senthil Kumar** (Department of Computer Science and Engineering)
