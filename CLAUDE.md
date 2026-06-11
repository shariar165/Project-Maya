# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

**Frontend:** Open `Maya.html` in a browser. No build step, no npm, no bundler. React 18 and Babel standalone are loaded from CDN; all `.jsx` files are transpiled in-browser at runtime.

**Infrastructure (local dev — run once):**
```
cd maya-backend
docker compose up -d          # starts PostgreSQL on 5433 + Redis on 6379
```

**Backend:**
```
cd maya-backend
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py                                  # FastAPI on port 8000
```

**MCP servers** (optional, for Phase 2 Claude-with-tools mode):
```
python -m mcp.knowledge_server   # port 8001
python -m mcp.patient_server     # port 8002
```

**Ingest PDFs** into ChromaDB knowledge base:
```
python ingest_all.py
```

**Required environment variables** (create `.env` in `maya-backend/`):
```
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
# PostgreSQL via Docker Compose (port 5433 — see Windows notes)
DATABASE_URL=postgresql://maya:maya_dev_password@127.0.0.1:5433/mayadb
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-to-a-random-32-char-secret
# SMTP — leave SMTP_USER empty for console fallback in dev
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=Maya Health <noreply@maya-health.com>
MCP_API_KEY=maya-mcp-secret-key-change-in-production
# Optional — TTS waterfall (see TTS section below)
GOOGLE_TTS_API_KEY=
# ElevenLabs is deprecated (elevenlabs_OLD.py); key not used by running code
ELEVENLABS_API_KEY=
TARA_VOICE_ID=9BWtsMINqrJLrRacOk9x
```

## Frontend architecture

`Maya.html` mounts `<IOSDevice width={402} height={874}>` containing `<MayaApp>`. JSX files load as `<script type="text/babel">` in strict order — each file depends on globals from earlier ones:

1. `ios-frame.jsx` — iOS frame, status bar, keyboard components
2. `tweaks-panel.jsx` — live-editing panel + `useTweaks` hook
3. `strings.jsx` — plain-JS localization (no JSX); must load before any screen
4. `auth.jsx` — `AuthScreen`, `OTPScreen`, `RegisterScreen`, `ForgotPasswordScreen`; helpers `saveTokens`, `refreshTokens`, `saveUser` on `window.*`
5. `tara.jsx` — Tara companion character (video-based, emotion-driven)
6. `home.jsx` — shared UI primitives (`Card`, `Pill`, `MeshBg`, `Grain`, `WeekRing`, `Waveform`) + `HomeScreen`
7. `screens-1.jsx` — `JourneyScreen`, `ChatScreen`, `VoiceScreen`
8. `screens-2.jsx` — `WellnessScreen`, `CareScreen`
9. `screens-3.jsx` — `SplashScreen`, `ProfileScreen`, `SettingsScreen`, `RiskScreen`
10. `app.jsx` — `Onboarding`, `BottomNav`, root `App` component

**No module system.** Every public export is assigned to `window.*` (e.g. `window.MayaApp = App`, `window.Tara = Tara`). Cross-file references use `window.ComponentName`.

**State flows top-down** from `App` via props: `{ state, setState, openScreen, tweak, setTweak }`.

**Week → month displayed data:** Always derive `displayWeek` as `_lsUser.pregnancyWeek ?? state.week` (localStorage first) — not bare `state.week` — to avoid showing stale tweakDefault values. HomeScreen, JourneyScreen, and ProfileScreen all follow this pattern.

## Localization

`strings.jsx` is a plain-JS file (no JSX, no React) that must load before any screen. It defines `window.MAYA_STRINGS` (keys in `en`, `bn`, `mixed`) and exposes `window.tStr(key, lang, type)` — the resolver called by every screen to get translated text. The `lang` tweak key (`bn` | `en` | `mixed`) flows down from `App` and is passed to `tStr`.

## Tweaks panel

Defaults live in `app.jsx` inside `/*EDITMODE-BEGIN*/` … `/*EDITMODE-END*/` markers. Current tweakable keys: `theme` (`dawn`/`dusk`/`night`), `week` (4–40), `mothersName`, `taraMood`, `lang`.

The tweak-sync effect (`app.jsx`) overwrites `state.week` from `t.week` on mount before the auth effect settles. Screens must therefore read from `localStorage.maya_user.pregnancyWeek` directly rather than relying solely on `state.week` for their initial render.

## Tara character

`Tara` is a `forwardRef` component that plays `.webm` video clips from `assets/tara/`. Emotion states map to video files in `_EMOTION_VIDEOS`. The imperative ref API (`play`, `speak`, `playFunny`, `playRandomFunny`) is used by chat/voice screens to sequence animations.

## Design system

- **Colors:** `#3D2840` plum (primary), `#FFF1E4` cream, `#2A1A36` deep text, `#5A3E5F` secondary text
- **Fonts:** `--display` = Instrument Serif (headings), `--ui` = Plus Jakarta Sans (body); both fall back to Noto Sans Bengali for bilingual support
- **Cards:** white `#FFFCF7` background, `borderRadius: 26`, glassmorphism shadows
- **Screens** scroll inside the fixed 402×874 iOS frame; bottom nav floats at `bottom: 28` inside the frame

## Backend architecture

FastAPI app (`main.py`) with a LangGraph multi-agent pipeline. All agents share `MayaState` (defined in `agents/response_composer.py`).

**Request flow:**
```
POST /ask → classify_intent (orchestrator.py)
              ├─ keyword pre-classify (fast, no LLM)
              └─ LLM classify → route to one of:
                   health_agent | symptom_agent | emotion_agent |
                   guardian_agent | emergency_agent | general_agent
                        └─ compose_tara_response() → JSON to frontend
```

**LLM stack** (`config.py`): Primary is Gemini 2.0 Flash; falls back to Groq (Llama 3.3 70B); final hardcoded Bangla fallback. Claude (`claude-sonnet-4-6`) is used only via `call_claude_with_mcp()` in Phase 2 MCP mode.

**RAG pipeline:** ChromaDB (`./chroma_db`) with hybrid BM25 + vector search + Reciprocal Rank Fusion, then BGE reranking (`rag/retriever.py`). Source PDFs live in `maya-backend/docs/raw/`.

**Database:** PostgreSQL (local dev via Docker Compose, port 5433). SQLAlchemy ORM. Models: `Patient`, `Session`, `AuthSession` (legacy), `HealthLog`, `Conversation`, `Appointment`, `ProactiveMessage`, `PatientBaseline`, `EmergencyLog`, `Reminder`, `IngestionLog`, `WellnessSession`. Always access ORM attributes inside the `with get_db() as db:` context — extracting primitives before the block closes to avoid `DetachedInstanceError`.

**Scheduled jobs** (APScheduler, started in `lifespan`):
- `scan_all_patients` — every 6 hours (proactive health monitoring)
- `send_medication_reminders` — 3:00 UTC (9am BD)
- `send_weekly_summary` — Sunday 1:00 UTC
- `send_good_morning_messages` — 2:00 UTC daily
- `process_retry_queue` — every 30 minutes (retries failed guardian alerts)

**TTS** (`tts/tts_router.py`): waterfall — Edge TTS (Microsoft, free, no key) → Google Cloud TTS (optional `GOOGLE_TTS_API_KEY`) → browser Web Speech API fallback. Returns `(audio_bytes, False)` or `(None, True)` to signal frontend fallback. ElevenLabs is removed (`tts/elevenlabs_OLD.py`).

**Monitoring module** (`monitoring/`): proactive patient scanning separate from the request pipeline.
- `monitoring_agent.py` — `scan_all_patients()`, `send_medication_reminders()`, etc.; uses `PatientBaseline` for personalized BP thresholds and a ranked concern severity system.
- `baseline_manager.py` — builds a per-patient baseline (BP, weight, engagement) over the first N days; `get_bp_alert_threshold()` uses it for dynamic alerting.
- `emotion_classifier.py` — logistic regression classifier trained from `docs/raw/data/merged_emotion.csv`; `build_emotion_classifier()` is warm-started at server startup; `score_conversation_turns()` scores recent messages.
- `message_templates.py` — Bangla/English proactive message templates keyed by concern type.

**Wellness module** (`wellness/` + `content/sessions/`):
- `wellness/session_loader.py` — loads and caches the 15 JSON session templates from `content/sessions/` (breathing, movement, calm, sleep categories); `_trimester_from_week()` maps week → trimester 1/2/3.
- `wellness/recommender.py` — `recommend(mood, week, conditions)` returns `{primary, alternates}` filtered by trimester and contraindications. Mood keys: `tender | happy | okay | tired | worried | heavy`.
- Sessions are JSON files in `content/sessions/` with fields: `id`, `category`, `allowed_trimesters`, `contraindications`, `steps`.
- API: `GET /wellness/recommend?patient_id=&mood=`, `GET /wellness/sessions`, `POST /wellness/sessions/complete`. Completion is recorded in the `WellnessSession` DB table.

**Auth module** (`auth/`): Email + password authentication with JWT tokens and email OTP verification.
- `auth/router.py` — 8 endpoints mounted at `/auth/*`: `register`, `verify-email`, `resend-verification`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password`
- `auth/password.py` — bcrypt hashing (12 rounds)
- `auth/token.py` — PyJWT HS256; access token 15 min, refresh token 30 days; `verify_access_token()` raises HTTP 401 automatically (used by protected endpoints in `main.py`)
- `auth/otp.py` — Redis-backed 6-digit OTP (SHA-256 hashed, 5-attempt limit, 5 min TTL); key pattern `otp:{email}:{purpose}`
- `auth/email_service.py` — SMTP via `smtplib` + STARTTLS; falls back to console print when `SMTP_USER` is empty
- `auth/limiter.py` — slowapi `Limiter` instance shared across auth endpoints
- **Session model** (`db/models.py`): tracks `refresh_jti` + `refresh_hash` per session; on refresh, old session is revoked and a new one created (token rotation); on JTI mismatch, all sessions for that patient are revoked (theft detection)
- **Token storage** (frontend): `localStorage.maya_access_token` (JWT), `localStorage.maya_refresh_token`, `localStorage.maya_session` (JSON envelope). Old `localStorage.maya_session.token` pattern preserved for backward compat. Use `window.refreshTokens()` to rotate silently.
- **Login flow:** `AuthScreen` (email + password, login/register tabs) → on register: `RegisterScreen` (name → week → lang, then `POST /auth/register`) → `OTPScreen` (email OTP, `POST /auth/verify-email`) → home. Forgot password: `ForgotPasswordScreen` (email → OTP → new password).
- `AuthSession` model kept as dead legacy; no longer written to.

**MCP servers** expose ChromaDB and patient DB as HTTP tool endpoints for direct Claude API calls.

**n8n workflows** (`maya-backend/n8n/workflows/`) handle document ingestion, daily reminders, emergency alerts, weekly reports, and missed-appointment follow-ups.

## `maya/` directory

Design handoff bundle from Claude Design — original prototype + chat transcripts. Working code is at the repo root, not inside `maya/project/`. Read `maya/chats/` for design rationale when intent is unclear.

## Windows-specific notes

- `main.py` reconfigures `sys.stdout`/`sys.stderr` to UTF-8 at startup to avoid `OSError` when printing Bangla text in a thread pool. Use `logging` instead of `print()` in agent/tool code that runs in LangGraph threads.
- Native PostgreSQL on this machine owns port 5432. Docker Compose maps the container to **5433** (`5433:5432`). Always use `DATABASE_URL=postgresql://...@127.0.0.1:5433/mayadb` — never port 5432, which hits the native instance and will fail auth.
- Start uvicorn **without** `--reload` (`python main.py` directly) — watchfiles triggers a continuous reload loop on Windows due to `.pyc` churn.
