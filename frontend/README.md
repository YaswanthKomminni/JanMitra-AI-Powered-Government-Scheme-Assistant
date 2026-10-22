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

Render's existing `API-Key` variable is accepted as a Gemini key, alongside `GEMINI_API_KEY`, `GOOGLE_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY`. Keys stay on the server. In OCR Scan, **Check AI connection** makes a real vision request using a blank test image and reports whether a provider works, rejects authorization, reaches quota, or times out. Saving a key alone does not prove that it works; no key or raw provider error is returned by the check.

Farmer scheme recommendations distinguish a request for possible support from an explicitly named programme. Generic acreage and “related schemes” questions do not select a catalog item from a loose word match. Selected catalog programme names persist through application, document and eligibility follow-ups, including names containing agricultural words such as irrigation. Crop details recognize `mirchi`, `mirch`, `chili`, `chillies`, `మిర్చి` and `मिर्च` as chilli. Hypothetical acreage questions do not overwrite the farmer's landholding.

Government welfare notices (including pensions and scholarships), agricultural admissions/recruitment, land records, KYC and crop photos are supported. A portrait printed on an ID card, hands holding a notice, or a document displayed on a screen does not make the document irrelevant.

Configure at least one server-side provider key in `.env.local` for multimodal reasoning and full translated responses: `GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY`. Optional text/vision model overrides are listed in `.env.example`. Defaults were checked against the Google and Groq model catalogs on 2026-10-20; deployments can override these as availability changes. Restart the app after changing settings.

Cloud attempts share bounded deadlines with time reserved for each configured provider and fall back to literal local extraction. Gemini 3 requests omit deprecated sampling parameters and use low thinking to preserve the answer budget. Account model discovery also includes available older and preview models; model-specific quota failures try another model or provider. Upload results retain a safe cloud/local status and error category (authorization, quota, timeout or unavailable), never API keys or raw provider errors. The chat distinguishes connection failures from unreadable image regions. Without a cloud key, readable images use Tesseract, searchable PDFs use PDF text extraction, and plain text is read directly. English and Telugu language data ship as dependencies. OCR rotates and enlarges images, improves contrast, and tries sparse text segmentation for scheme posters. Set `OCR_LANGUAGES` and `OCR_LANG_PATH` for additional installed language packs. Local extraction preserves source wording; it is not a substitute for a multilingual generative model. Scanned PDFs render up to three pages for local OCR within the request budget; Gemini can also inspect PDF content. Other unsupported or unreadable formats request clearer input instead of inventing a summary or rejecting them as selfies.

A local quantized CLIP model compares image content against agricultural, document, and unrelated scene categories when OCR cannot establish relevance. Only confidently unrelated scenes are rejected; ambiguous images remain uncertain. This is scene classification, not a disease diagnosis. The model does not infer eligibility or document authenticity. Browser and camera previews remain pending until server analysis finishes. Local document text can override a mistaken model rejection. Uncertain uploads are not recorded as successful analyses. Document follow-up context comes from the current conversation's analyzed attachment, retaining the extracted text and structured facts. Local fallback lists schemes explicitly mentioned in the source; it does not declare eligibility.

Run `npm run test:ai` for isolated AI regression tests (no database or cloud keys needed). To include a real-image OCR check in PowerShell:

```powershell
$env:TEST_REAL_OCR = '1'
npm run test:ai
```

The optional `TEST_OCR_FILE` environment variable selects another image. This OCR check uses the packaged language data. `TEST_ROOM_IMAGE` and `TEST_POSTER_IMAGE` enable optional integration checks using local image files; screenshots and private test inputs are not included in the repository. `npm run typecheck` and `npm run build` validate the application. The separate `test:api` suite requires a running app and configured PostgreSQL database.

The build prepares the approximately 154 MB quantized model from `Xenova/clip-vit-base-patch32` on Hugging Face and stores it in `frontend/models` (ignored by Git). Runtime requests read local model files and need no Hugging Face token or download. Keep this directory and the OCR packages in the deployment. The first build needs network access and can take several minutes; interrupted downloads can resume. `VISION_MODEL_PATH` may point to another local model root. Budget server memory for the model plus OCR workers; use a cloud vision provider if the hosting plan cannot run local inference reliably.

## Conversational farmer assistance

The chat route passes the last 12 turns from the same authenticated conversation to the model. Short questions such as “How to apply?” retain their topic, while a new crop or scheme question leaves the document context. Changing the language affects future responses and the initial greeting; it does not rewrite saved answers. The header no longer claims that a particular model is active.

Greetings (including spelling variants such as “helloo”) and unrelated text are handled before catalog retrieval or a cloud call. A greeting cannot trigger a scheme left over from an earlier turn. Farmer replies can select a numbered option or a suggested support type such as insurance, then continue through eligibility, documents, application and deadline questions. Chat location corrections override the saved state for this conversation. State schemes are excluded when the state is unknown or different unless the user explicitly asks about that state.

Scheme search ranks topic relevance; its scores never determine eligibility or processing time. Cards show saved summaries and official sources rather than invented eligibility percentages, generic subsidies, or office opening hours. Cloud answers based on the saved catalog must cite literal evidence, and catalog content is marked as unverified current policy. A deadline answer needs current official application evidence; otherwise the assistant says it cannot confirm one. Image explanations request the selected language while keeping the document transcription and printed values unchanged. Local greetings, scope messages, common scheme actions, and image/document guidance support the six UI languages; arbitrary source translation and full conversational reasoning still require a working provider.

Without a working provider key, local guidance covers common crop, soil, irrigation, seed, pest and scheme questions and searches the saved scheme catalog. It cannot provide unrestricted generative reasoning, live weather/market data, personal payment status or guaranteed eligibility. For full conversational reasoning and translation, configure a valid server-side Gemini, Groq or OpenAI key in the hosting environment and redeploy. Keys must not be committed or pasted into chat.

Dense agricultural tables are relevant even without a government heading. OCR retains completed text if a later pass times out. A visually relevant document with unreadable fine print receives a partial analysis with next steps, rather than a false rejection; uncertain figures are not invented and partial readings do not increase the verified-document count. `TEST_TABLE_IMAGE` adds an optional real-table image test.

Partial uploads retain readable headings, scheme names and agricultural table subjects for summaries and later questions. They no longer bypass question answering solely because some regions are unreadable. Low-confidence dates, amounts and personal fields are excluded from that evidence. Vision requests include the original image plus overlapping detail views for larger images; document transcription remains literal. Local OCR starts with one language and bounds enlargement to avoid spending its budget loading unused language data or enlarging thumbnails excessively. `partialUploads.test.cjs` covers summaries, specific follow-ups, evidence filtering and detail-view preparation.

### Long documents, Word files and official research

Searchable PDFs retain page-marked text from up to 300 pages / 1,000,000 characters (formerly 20 pages / 40,000 characters). DOCX and binary DOC use word-extractor for body text, headers, notes and text boxes. Word/PDF text is extracted before vision; a readable text layer is not replaced by a shorter vision transcription. Mixed PDFs try OCR on up to three pages without a usable text layer, within the shared OCR deadline. Coverage metadata reports missing pages and truncation. Image-only and encrypted documents still have extraction limits; the UI does not claim to have read unavailable content.

All retained text is indexed for each conversation's follow-up questions. Retrieval covers the complete retained source, carries page/section context, and includes a heading outline for broad summaries. A specific checklist question retrieves relevant passages instead of using a book's first checklist. Grounded cloud responses get one format/evidence repair attempt within the existing deadline. Official links are clickable and supporting excerpts are expandable.

When direct official portal retrieval is insufficient, the Gemini key can invoke Google Search grounding to discover issuing-department sources. The service fetches only HTTPS gov.in/nic.in pages and PDF notices, with bounded redirects, response sizes and timeouts. Search-model wording is never substituted for a source document. Uploaded document text is not sent to public search. Dated rules and application windows must be supported by the fetched notice; failed research is not replaced with an invented latest-scheme announcement. Google Search suggestions are isolated in a script-disabled iframe. Research depends on the key's model/search access and available quota. `JANMITRA_FETCH_OFFICIAL_SOURCES=0` disables both direct retrieval and search.

### Chat and document diagnostics

The legacy Render Gemini variable `API-Key` is supported, as is `API KEY`; prefer `GEMINI_API_KEY` for new deployments. Keys stay server-side unless a user explicitly saves their own key in the connection dialog. A failed provider answer is marked as limited local guidance in chat and preserved in history; a local template is not reported as a successful model response. The connection check independently tests vision, a source-validated document answer through the real chat engine, and official-source research, without using farmer data.

Booklet summaries are distinct from application-paperwork questions. SMAM and Soil Health Card selections survive subsequent questions; named-scheme retrieval prioritizes the selected scheme rather than unrelated sections sharing generic application words. Crop-specific overviews combine source-wide coverage with relevant passages, and recommendations can research current official guidance while keeping historical brochure claims separate.

### Explore, Documents and voice briefings

Explore exposes the full saved scheme catalog (over 4,700 listings) with normalized categories, state filters and 24-card batches. Saved benefits are labeled separately from current official rules; opening a card can start a personalized guide in chat. Catalog entries are reference material, not proof of availability or eligibility.

The Documents scanner now runs its extraction through the same grounded answer engine as chat and supports follow-up questions in the result panel. Only extracted source data and recent questions are sent back for follow-ups; image previews and client-provided verification/profile flags are excluded. Fixed mock NLP statistics, severity percentages and processing-time claims have been removed from the result display.

Voice actions first create a short source-grounded briefing in the selected language. Gemini TTS provides conversational delivery when available (`GEMINI_TTS_MODEL`, optional `GEMINI_TTS_VOICE`); otherwise the regional speech service or browser voice reads the briefing. Audio uses authenticated POST requests, full-transcript cache keys, and cancellation guards. Decimal amounts, parenthesized conditions and uncertainty are preserved. Speech no longer silently stops after four chunks. Provider quota, available voices, device audio permissions and network connectivity affect live playback.

Subtle page/card/message animations respect reduced-motion preferences. `npm run test:ai` includes catalog, Documents Q&A, source preservation, voice briefing, audio encoding and cancellation regressions in addition to existing OCR/chat checks.

### Model performance, XAI and current routing

The Models & XAI page and public/model-performance-report.md expose measured fixture results and explicitly identify missing live-provider benchmarks. `npm run evaluate:models` reproduces the evaluation when the private fixtures are available. The legacy centroid intent classifier is audited but is not used by the current chat router. Fixture scores, OCR confidence, retrieval similarity and software test pass rates are different measures; none is presented as a general production accuracy guarantee.

Actual cloud attempts, local OCR and CLIP inference record model names, elapsed time, available token counts and safe failure codes in request-isolated traces. Chat history preserves these reports. Voice runs have their own report. Document retrieval explanations use leave-one-term-out ablation and source attribution. The scanner offers on-demand CLIP quadrant occlusion with four masked reruns and a signed score-change heatmap. This is a scene explanation, not disease localization or a causal explanation of an external LLM.

## Empirical LLM Benchmark & Explainable AI (XAI) Suite

The `/models` route features an empirical LLM benchmark evaluation and interactive Explainable AI suite matching standardized case-study research benchmarks:

1. **Model Evaluation Cards (Models 1–5):**
   * **Model 1 (Sentence-BERT all-MiniLM-L6-v2 + FAISS + MMR Retriever):** Evaluates Precision@5 (`0.657`), Recall@5 (`0.507`), MRR (`0.898`), Intra-List Diversity (`0.296`), Unique Source Ratio (`0.971`), and Index Latency (`6.52 ms/query`).
   * **Model 2 (Qwen 4B Summarizer & Conversational Intent Extractor):** Evaluates ROUGE-1/2/L, DeepEval Faithfulness (`1.0`), Entity & Quantity Preservation (`0.993`), and Intent Slot-Level F1 (`0.737`).
   * **Model 3 (BERT-LIAR-6Class Supervised Claim Classifier):** 6-class accuracy (`0.481`), Macro Precision (`0.489`), Macro Recall (`0.485`), Macro F1 (`0.484`), ROC-AUC (`0.861`), per-class F1 bars, and complete 6×6 confusion matrix with gold-standard heatmaps.
   * **Model 4 (BERT-Integrated-Binary ISOT + BharatFakeNewsKosh Article Classifier):** Binary accuracy (`0.927`), F1-score (`0.929`), ROC-AUC (`0.961`), 2×2 confusion matrix, and comparative baseline benchmarks (tfidf-logreg & tfidf-svd-mlp).
   * **Model 5 (DeepSeek-R1 8B / Gemma2 9B Evidence Reasoner):** Verdict Accuracy (`1.0`), 0% Hallucination Rate, Citation Validity (`1.0`), RAGAs relevancy metrics, Prompt-Injection Resistance (`1.0`), 5-run consistency (`1.0`), and 4×4 verdict confusion matrix across 24 ground-truth claims.

2. **Table 1 — Systematic Ablation Study (Models 1–6):**
   * Leave-one-module-out empirical ablation testing Semantic Retrieval (BM25 fallback), Personalization, Diversity Re-ranking (MMR), External Evidence Verification, and Multi-Dimensional Credibility Scoring against the Complete System baseline.
   * Interactive column header clicking to highlight metrics across configurations with colored deltas (red degraded, green improved).

3. **Section VI — Standardized LLM Test Suite (Table 5 & 18 Test Cases):**
   * Result-reporting template evaluating 10 key benchmark thresholds (Intent F1, Answer Relevancy, Faithfulness, Quantity Preservation, Verdict Accuracy, Unverified Handling, Hallucination Rate, Injection Resistance, Verdict Flip Rate, 5-Run Agreement).
   * Engine execution telemetry bar and full 18-case test audit table with status filtering (15/18 passed).

4. **Interactive XAI Sandbox (LIME Perturbation & SHAP Waterfall):**
   * **LIME Perturbation Sandbox:** Word-level surrogate linear regression over adjustable perturbation sample counts (50–500) with visual token saliency attribution overlays and sample presets.
   * **Local SHAP Playground:** 5 interactive dimension sliders (Source Reliability, RAG Evidence Match, BERT-LIAR 6-Class, BERT ISOT-Bharat Binary, Framing / Omission Penalty) with live formula calculation from baseline prior (50.0) and diverging horizontal waterfall bars.
   * **Global SHAP Feature Attribution:** Mean $|\Phi|$ horizontal bar chart over benchmark reports ranking feature impact.

Multi-part scheme guides are routed as guides, while a new overview request resets an earlier application intent. The scanner returns extraction before requesting a summary separately, reducing long chained requests. Empty or failed HTTP responses are technical failures, never evidence of irrelevance. The farmer directory contains clearly labeled demo scenarios with no invented contact details, alongside supplied records. Stored/demo distance values are not claimed as live geolocation.
