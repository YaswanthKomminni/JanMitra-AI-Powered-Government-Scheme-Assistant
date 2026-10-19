# JanMithra: AI-Powered Government Scheme Assistant



An accessible, mobile-first, and voice-first conversational AI platform designed to bridge the rural digital divide in India. **JanMithra** empowers farmers, smallholders, and rural citizens to discover personalized government welfare schemes, verify land/soil records with AI Vision OCR, and connect with nearby peer farmers who successfully claimed subsidies.

---

## 🌾 Key Highlights

- **Rural-First UX:** High-contrast emerald/amber palette, 48px+ tactile buttons, and on-screen numeric keypad for mobile-number entry.
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
- **MySQL 8.0+**

### 1. Create a MySQL user for the app
Use a dedicated account rather than `root` (in the MySQL shell or Workbench):
```sql
CREATE USER 'janmitra_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON JanMithra.* TO 'janmitra_app'@'localhost';
```
(`npm run db:setup` creates the `JanMithra` schema, so that user needs `CREATE` rights on it. Alternatively run `JanMithra_setup.sql` once as root.)

### 2. Configure environment variables
```bash
cd frontend
cp .env.example .env.local      # then edit DB_USER / DB_PASSWORD
```

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DB_HOST` | yes | `127.0.0.1` | MySQL host |
| `DB_PORT` | no | `3306` | MySQL port |
| `DB_USER` | yes | `root` | MySQL user (use a dedicated user) |
| `DB_PASSWORD` | yes | *(empty)* | MySQL password |
| `DB_NAME` | no | `JanMithra` | Database name |
| `SESSION_TTL_DAYS` | no | `7` | How long a sign-in lasts |
| `BCRYPT_COST` | no | `12` | Password hashing work factor (10–14) |
| `COOKIE_SECURE` | no | `true` in production | Set `false` only for `npm start` over plain http |
| `SIGNUP_RATE_LIMIT_PER_HOUR` | no | `30` | Sign-ups per IP per hour |
| `JANMITRA_SIMULATE_AI_FAILURE` | no | — | Dev only: test the Retry flow |

Database credentials are configured **only** on the server. The old browser form that asked for the MySQL root password was removed.

### 3. Install, set up the database, and run
```bash
cd frontend
npm install
npm run db:setup      # fresh install: runs JanMithra_setup.sql + all migrations
# or, for an EXISTING JanMithra database:
npm run db:migrate    # applies database/migrations/*.sql (safe to re-run)

npm run dev           # development: http://localhost:3000
# production:
npm run build && npm start
```
Both database commands are **non-destructive**: they never drop tables or delete farmer, scheme or peer records. Workbench users can instead execute `JanMithra_setup.sql` and then each file in `database/migrations/`. (`python scripts/setup_mysql.py` does the same on Windows.)

### 4. Existing farmer records
The original app stored the literal password `"1234"` in plaintext for every account. Migration `001` **keeps every user record** but clears any password that is not a bcrypt hash. Those accounts cannot sign in until an administrator sets a password:
```bash
npm run user:set-password -- 9876543210   # prompts for the new password (hidden)
```
The demo farmers (Ramesh Goud, Sunita Devi, Murugan S.) are no longer seeded and cannot log in with `1234`. If you don't need them, delete them with `DELETE FROM users WHERE phone IN (...)`.

---

## 🔐 Accounts, sign-in & saved conversations

- **Sign up** with full name, 10-digit mobile number, optional email, and a password (min 8 characters, with letters and numbers) plus confirmation. Farm profile fields (state, district, village, land size, soil, irrigation, crops, income, language) are optional.
- **Sign in** with mobile number + password. The previous "OTP" option was removed: it showed "OTP sent" but never sent or verified anything. Real OTP needs an SMS provider (see *Known limitations*).
- **The assistant requires sign-in.** Guests can browse schemes and the peer network. Asking a question, uploading or scanning a document, voice read-out, or opening the chat asks them to sign in. A question typed before signing in is restored into the chat box afterwards and is sent only when the user presses Send.
- **History**: every question and answer is saved in MySQL. The chat view has a conversation sidebar (new chat, open, switch, delete with confirmation). Conversations are restored after refresh, logout and login. On phones the sidebar opens as a drawer.

### How it works
| Piece | Implementation |
|---|---|
| Password storage | bcrypt (cost 12) via `bcryptjs`; plaintext is never stored |
| Session | Random 256-bit token in an **HttpOnly, SameSite=Lax** cookie (`Secure` in production); only its SHA-256 hash is stored in `user_sessions`. Logout deletes the row, so a copied cookie stops working. |
| Authorization | Every protected route derives the user id from the session (`requireUser`); any `userId` sent by the browser is ignored. Every conversation query filters on `user_id`, so another user's id returns **404**. |
| SQL | All queries use `?` placeholders (mysql2) |
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
npm run test:api                # in another: 15 end-to-end API tests against the running app + MySQL
```
`test:api` covers sign-up validation, duplicates, hashing, login and wrong passwords, legacy accounts, logout invalidation (cookie replay), protection of every AI endpoint, persistence across logout/login, retry de-duplication, cross-user isolation (including manually edited conversation ids and spoofed `userId`), deletion, input validation, CSRF and rate limiting. It creates its own test users and deletes them afterwards.

To exercise the AI-failure path manually: `JANMITRA_SIMULATE_AI_FAILURE=1 npm run dev`, send a message (it is saved, the reply fails), restart without the flag, and press **Retry**.

---

## ⚠️ Known limitations
- **The reply engine still contains demo-farmer details.** The conversational engine (now in `frontend/src/lib/chatEngine.ts`, moved unchanged from the browser) is keyword-based and many replies hardcode "Ramesh", "3.5 acres", "Kothur", a "verified Dharani passbook" and an SBI account, whoever is signed in. Personalising those texts in all six languages is the recommended next step.
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
