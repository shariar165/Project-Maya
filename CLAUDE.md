# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

**Frontend:** Open `Maya.html` in a browser. No build step, no npm, no bundler. React 18 and Babel standalone are loaded from CDN; all `.jsx` files are transpiled in-browser at runtime.

**Backend:**
```
cd maya-backend
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt                 # if available; else install from imports
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
ELEVENLABS_API_KEY=
TARA_VOICE_ID=9BWtsMINqrJLrRacOk9x
DATABASE_URL=sqlite:///./maya.db
MCP_API_KEY=maya-mcp-secret-key-change-in-production
```

## Frontend architecture

`Maya.html` mounts `<IOSDevice width={402} height={874}>` containing `<MayaApp>`. JSX files load as `<script type="text/babel">` in strict order — each file depends on globals from earlier ones:

1. `ios-frame.jsx` — iOS frame, status bar, keyboard components
2. `tweaks-panel.jsx` — live-editing panel + `useTweaks` hook
3. `auth.jsx` — `AuthScreen`, `OTPScreen`, `RegisterScreen`; uses `localStorage` for session/user
4. `tara.jsx` — Tara companion character (video-based, emotion-driven)
5. `home.jsx` — shared UI primitives (`Card`, `Pill`, `MeshBg`, `Grain`, `WeekRing`, `Waveform`) + `HomeScreen`
6. `screens-1.jsx` — `JourneyScreen`, `ChatScreen`, `VoiceScreen`
7. `screens-2.jsx` — `WellnessScreen`, `CareScreen`
8. `screens-3.jsx` — `SplashScreen`, `ProfileScreen`, `SettingsScreen`, `RiskScreen`
9. `app.jsx` — `Onboarding`, `BottomNav`, root `App` component

**No module system.** Every public export is assigned to `window.*` (e.g. `window.MayaApp = App`, `window.Tara = Tara`). Cross-file references use `window.ComponentName`.

**State flows top-down** from `App` via props: `{ state, setState, openScreen, tweak, setTweak }`.

## Tweaks panel

Defaults live in `app.jsx` inside `/*EDITMODE-BEGIN*/` … `/*EDITMODE-END*/` markers. Current tweakable keys: `theme` (`dawn`/`dusk`/`night`), `week` (4–40), `mothersName`, `taraMood`, `lang`.

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

**Database:** SQLite by default (`maya.db`), SQLAlchemy ORM. Models: `Patient`, `AuthSession`, `HealthLog`, `Conversation`, `Appointment`, `ProactiveMessage`, `EmergencyLog`, `Reminder`. Always access ORM attributes inside the `with get_db() as db:` context — extracting primitives before the block closes to avoid `DetachedInstanceError`.

**Scheduled jobs** (APScheduler, started in `lifespan`):
- `scan_all_patients` — every 6 hours (proactive health monitoring)
- `send_medication_reminders` — 3:00 UTC (9am BD)
- `send_weekly_summary` — Sunday 2:00 UTC

**MCP servers** expose ChromaDB and patient DB as HTTP tool endpoints for direct Claude API calls.

**n8n workflows** (`maya-backend/n8n/workflows/`) handle document ingestion, daily reminders, emergency alerts, weekly reports, and missed-appointment follow-ups.

## `maya/` directory

Design handoff bundle from Claude Design — original prototype + chat transcripts. Working code is at the repo root, not inside `maya/project/`. Read `maya/chats/` for design rationale when intent is unclear.

## Windows-specific notes

- `main.py` reconfigures `sys.stdout`/`sys.stderr` to UTF-8 at startup to avoid `OSError` when printing Bangla text in a thread pool. Use `logging` instead of `print()` in agent/tool code that runs in LangGraph threads.
