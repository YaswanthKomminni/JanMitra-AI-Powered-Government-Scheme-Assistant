# JanMithra: AI-Powered Government Scheme Assistant

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

An accessible, mobile-first, and voice-first conversational AI platform designed to bridge the rural digital divide in India. **JanMithra** empowers farmers, smallholders, and rural citizens to discover personalized government welfare schemes, read land/soil records with AI Vision OCR, and connect with nearby peer farmers who successfully claimed subsidies.

---

## 🌾 Key Highlights

- **Rural-First UX:** High-contrast emerald/amber palette, 48px+ tactile buttons, and on-screen numeric keypad for mobile-number entry.
- **Multilingual Support (6 Languages):** Full native translations in **English**, **हिन्दी (Hindi)**, **తెలుగు (Telugu)**, **தமிழ் (Tamil)**, **ಕನ್ನಡ (Kannada)**, and **বাংলা (Bengali)**.
- **Voice Accessibility:** Push-to-Talk Speech-to-Text (STT) and Audio Read-out (TTS) in regional dialects.
- **Personalized Scheme Discovery:** Match scoring based on land size, soil classification, irrigation type, and geographic location (PM-KISAN, PM-KUSUM, PMFBY, Soil Health Cards).
- **PostGIS Peer Network:** Connects farmers with nearby successful peers within 5km, 10km, and 25km radii.
- **Evidence-based image and document help:** Configurable Gemini, Groq and OpenAI vision, independent English/Telugu OCR, scanned-PDF reading, document passage retrieval and source-checked answers. Crop observations and possible causes are presented separately; a photo does not verify a diagnosis, document authenticity or eligibility.

---

## 📁 Repository Structure

```
.
├── frontend/                  # Next.js 14 App Router UI (React, Tailwind, Zustand)
│   ├── src/
│   │   ├── app/               # Next.js routes (incl. /api/auth, /api/chat, /api/conversations), layout
│   │   ├── components/        # UI components (Navbar, ChatAssistant, ConversationSidebar, AuthForm, Modals)
│   │   ├── lib/               # auth, db, chat engine & history, i18n, OCR, speech
│   │   └── store/             # Zustand state management
│   ├── scripts/               # db:migrate / db:setup / user:set-password
│   ├── tests/                 # API end-to-end tests (npm run test:api)
│   ├── .env.example
│   ├── package.json
│   └── tailwind.config.ts
├── database/migrations/       # Idempotent SQL migrations (auth + chat history)
├── JanMithra_setup.sql        # Non-destructive base schema + scheme/peer seed data
├── dataset/                   # Government scheme schemas and conversational NLP queries
│   ├── schemes/               # Structured scheme metadata (JSON & CSV)
│   ├── conversational_nlp/    # Multilingual intent and entity queries
│   └── metadata.json
├── docs/                      # Base paper documentation and research review
├── scripts/                   # Synthetic dataset generators and verification scripts
└── README.md
```

---

## 🚀 Running JanMithra

### Requirements
- **Node.js 18.18+** (tested on Node 22) and npm
- **PostgreSQL 14+** (tested on 16)

### 1. Create a PostgreSQL role and database for the app
Use a dedicated role rather than a superuser (in `psql`, as an admin):
```sql
CREATE ROLE janmitra_app LOGIN PASSWORD 'choose-a-strong-password';
CREATE DATABASE janmitra OWNER janmitra_app;
```
(Or give the role `CREATEDB` and let `npm run db:setup` create the database for you.)

### 2. Configure environment variables
```bash
cd frontend
cp .env.example .env.local      # then edit DATABASE_URL
```

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | — | PostgreSQL connection string, e.g. `postgresql://janmitra_app:password@127.0.0.1:5432/janmitra` (URL-encode special characters in the password; add `?sslmode=require` if your server needs TLS) |
| `DB_POOL_SIZE` | no | `10` | Max pooled connections |
| `SESSION_TTL_DAYS` | no | `7` | How long a sign-in lasts |
| `BCRYPT_COST` | no | `12` | Password hashing work factor (10–14) |
| `COOKIE_SECURE` | no | `true` in production | Set `false` only for `npm start` over plain http |
| `SIGNUP_RATE_LIMIT_PER_HOUR` | no | `30` | Sign-ups per IP per hour |
| `JANMITRA_SIMULATE_AI_FAILURE` | no | — | Dev only: test the Retry flow |

`DATABASE_URL` is read **only** on the server and is never sent to the browser. `.env.local` is excluded from Git; only `.env.example` (placeholders) is committed.

### 3. Install, set up the database, and run
```bash
cd frontend
npm install
npm run db:setup      # creates the database if missing, then applies all migrations
# or, if the database already exists:
npm run db:migrate    # applies database/postgres/migrations/*.sql (safe to re-run)

npm run dev           # development: http://localhost:3000
# production:
npm run build && npm start
```
Both database commands are **non-destructive**: they never drop tables or delete data. Applied migrations are recorded (with a checksum) in `schema_migrations`, so re-running only applies new files.

### 4. Moving data from an existing MySQL install (optional)
Skip this on a fresh install. The old MySQL files are kept in `database/legacy-mysql/` for reference. To copy existing users, sessions, conversations, messages, documents and peer stories into PostgreSQL:
```bash
cd frontend
npm run db:setup                        # PostgreSQL schema must exist first
npm install --no-save mysql2            # needed only for this one-off transfer
# set MYSQL_URL=mysql://user:password@127.0.0.1:3306/JanMithra (shell or .env.local)
npm run db:transfer-mysql               # DRY RUN: does everything, then rolls back
npm run db:transfer-mysql -- --execute  # real run (one transaction, all or nothing)
```
MySQL is only read. The transfer refuses to run if PostgreSQL already has users, conversations or messages. Ids are preserved, so every user keeps their own chat history. Live sessions are carried over; expired ones are not.

### 5. Existing farmer records
The original app stored the literal password `"1234"` in plaintext for every account. The transfer **keeps every user record** but does not copy any password that is not a bcrypt hash (PostgreSQL also rejects non-bcrypt hashes with a CHECK constraint). Those accounts cannot sign in until an administrator sets a password:
```bash
npm run user:set-password -- 9876543210   # prompts for the new password (hidden)
```
The demo farmers (Ramesh Goud, Sunita Devi, Murugan S.) are no longer seeded and cannot log in with `1234`.

---

## 🔐 Accounts, sign-in & saved conversations

- **Sign up** with full name, 10-digit mobile number, optional email, and a password (min 8 characters, with letters and numbers) plus confirmation. Farm profile fields (state, district, village, land size, soil, irrigation, crops, income, language) are optional.
- **Sign in** with mobile number + password. The previous "OTP" option was removed: it showed "OTP sent" but never sent or verified anything. Real OTP needs an SMS provider (see *Known limitations*).
- **The assistant requires sign-in.** Guests can browse schemes and the peer network. Asking a question, uploading or scanning a document, voice read-out, or opening the chat asks them to sign in. A question typed before signing in is restored into the chat box afterwards and is sent only when the user presses Send.
- **History**: every question and answer is saved in PostgreSQL. The chat view has a conversation sidebar (new chat, open, switch, delete with confirmation). Conversations are restored after refresh, logout and login. On phones the sidebar opens as a drawer.

### How it works
| Piece | Implementation |
|---|---|
| Password storage | bcrypt (cost 12) via `bcryptjs`; plaintext is never stored |
| Session | Random 256-bit token in an **HttpOnly, SameSite=Lax** cookie (`Secure` in production); only its SHA-256 hash is stored in `user_sessions`. Logout deletes the row, so a copied cookie stops working. |
| Authorization | Every protected route derives the user id from the session (`requireUser`); any `userId` sent by the browser is ignored. Every conversation query filters on `user_id`, so another user's id returns **404**. |
| SQL | All queries are parameterized (`$1`, `$2`, … via `pg`); a composite foreign key also stops a message being stored under another user's conversation |
| CSRF | SameSite cookies plus an `Origin` check on state-changing requests |
| Brute force | Login: 8 attempts / 15 min per phone+IP; sign-up limit per IP (in-memory, per server process) |
| Retries | Each message carries a `clientMessageId`; a unique index makes retries idempotent, so there are never duplicate questions or answers |
| Failures | If the database is down, the API returns 503 and the UI marks the message *not saved* with a Retry button. If the assistant fails, the question is saved, the API returns 502, and Retry produces the answer once. |

### Database tables (after migration 001)
| Table | Purpose |
|---|---|
| `users` | existing table, reused: login identifiers, `password_hash` (bcrypt), farmer profile, `last_login_at`, unique phone + email |
| `user_sessions` | server-side sessions (token hash, expiry, user agent) |
| `conversations` | `id` (UUID), `user_id`, `title` (from the first question), `created_at`, `updated_at` |
| `chat_logs` | existing table, reused as the message store: `conversation_id`, `sender` (user/ai), `message_text`, `language`, `metadata` (chips, document analysis), `client_message_id`, `created_at` |
| `schema_migrations` | applied migrations |

### API routes
| Route | Auth | Purpose |
|---|---|---|
| `POST /api/auth/signup` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` | — | account & session |
| `POST /api/chat` | required | save question → generate reply → save reply |
| `GET /api/conversations` · `GET/DELETE /api/conversations/:id` | required, owner only | history |
| `POST /api/ocr/analyze` · `POST /api/verify-doc` · `GET/POST /api/tts` | required | document AI & voice read-out |
| `GET /api/schemes` · `GET /api/peers` · `GET /api/db-status` | public | scheme catalogue, peers, health check (`{connected}` only) |

---

## ✅ Tests
```bash
cd frontend
npm run typecheck
npm run lint
npm run build && npm start      # in one terminal
npm run test:api                # in another: 15 end-to-end API tests against the running app + PostgreSQL (needs `DATABASE_URL`)
```
`test:api` covers sign-up validation, duplicates, hashing, login and wrong passwords, legacy accounts, logout invalidation (cookie replay), protection of every AI endpoint, persistence across logout/login, retry de-duplication, cross-user isolation (including manually edited conversation ids and spoofed `userId`), deletion, input validation, CSRF and rate limiting. It creates its own test users and deletes them afterwards.

To exercise the AI-failure path manually: `JANMITRA_SIMULATE_AI_FAILURE=1 npm run dev`, send a message (it is saved, the reply fails), restart without the flag, and press **Retry**.

---

## Image reading and answer grounding

- Cloud defaults: Gemini `gemini-3.8-flash`; Groq text `openai/gpt-oss-120b` with `qwen/qwen3.8-27b` fallback/vision; OpenAI `gpt-4.1` with `gpt-4.1-mini` fallback. Server environment overrides remain supported. Groq's retired Llama text IDs are no longer defaults. See the [Groq deprecation notice](https://console.groq.com/docs/deprecations), [Gemini catalog](https://ai.google.dev/gemini-api/docs/models), and [OpenAI model capabilities](https://developers.openai.com/api/docs/models/gpt-4.1).
- Image reading compares vision transcription with independent local OCR. Conflicting critical fields or table figures trigger a request for a clearer source. Unsupported extracted fields are dropped. OCR retries weak readings even when a government keyword was already found.
- Searchable PDFs use their text layer. Scanned PDFs render and OCR up to three pages within the OCR deadline. Longer scans require the relevant page or original text; blank/failed extraction is never proof of irrelevance.
- BM25 retrieves relevant passages using multilingual tokens, query expansion and length normalization. Cloud document answers use JSON claims with exact supporting quotes. Validation checks citations, literal quotes, numbers, units and basic crop/item consistency. Failed validation falls back to literal source extraction. This is a reliability check, not a guarantee of semantic correctness or calibrated accuracy.
- General questions about PM-KISAN, PMFBY and PM-KUSUM can retrieve public HTML from their fixed official portals when a cloud key is configured. Redirects, unreadable/oversized responses and failures are not evidence. Responses are cached for 15 minutes. Set `JANMITRA_FETCH_OFFICIAL_SOURCES=0` to disable. There is no unrestricted web search or claim that every scheme rule has been checked live.
- Crop vision requests visible symptoms, possible causes with distinguishing checks, limitations and low-risk next actions. It cannot measure soil nutrients or validate a pesticide label. Dose recommendations are filtered from local crop suggestions.
- Run `npm run test:ai` from `frontend` for offline and mocked-provider regressions. To include the local image fixtures, set `TEST_REAL_OCR=1`, `TEST_ROOM_IMAGE`, `TEST_POSTER_IMAGE` and `TEST_TABLE_IMAGE` to the relevant test files. Provider mocks test handling and grounding; they do not measure a live model's agronomic accuracy.

## ⚠️ Known limitations
- **Cloud AI requires a working provider key.** Without one, chat uses a limited local agriculture/scheme guide and grounded document extraction. It cannot provide unrestricted generative answers, live prices, weather, payment status or verified eligibility.
- Chat stores a compact memory with each assistant reply, scoped to the authenticated user and conversation. Known crop, age, acreage, location, soil and irrigation details remain available beyond the 12 recent turns sent to cloud models. Explicit chat corrections override the saved profile for that conversation only; a new chat starts with the saved profile. Assistant suggestions and example documents do not establish personal farm facts.
- **No real OTP / password reset.** Adding SMS OTP or self-service reset needs an SMS/email provider. Until then, an administrator resets passwords with `npm run user:set-password`.
- Rate limits are in memory and per process. Use a shared store (e.g. Redis) if you run several instances.
- Uploaded images are not stored in chat history (only the file name and the analysis are), so older messages show a file chip instead of the photo.

---

## 👥 Authors & Team
- **Komminni Yaswanth** (CB.SC.U4CSE24024)
- **P J Abhiram** (CB.SC.U4CSE24039)
- **S. Sai Sumalik** (CB.SC.U4CSE24647)
- **Vutla Charan** (CB.SC.U4CSE24258)

Faculty Guide: **Dr. T Senthil Kumar** (Department of Computer Science and Engineering)
