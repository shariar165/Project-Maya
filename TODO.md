# Maya Backend — Remaining Work

## 0. Monitoring Agent — Untested Items

- [ ] **LLM message generation** — Verify Gemini generates valid plain Bangla text (not JSON) for proactive messages. Test with a real `GEMINI_API_KEY`. Note: Groq fallback always returns JSON (forced by `response_format: json_object`), so the `startswith("{")` guard in `_generate_message` will use a template instead — confirm this is acceptable or add a plain-text Groq call path.

- [ ] **APScheduler job registration** — Start the backend and confirm all 5 jobs appear. From a Python shell while the server is running, check `scheduler.get_jobs()` returns `scan_all_patients`, `medication_reminders`, `weekly_summary`, `good_morning`, `retry_queue`. Also confirm the startup log shows `"LangGraph + RAG models + emotion classifier ready."`.

- [ ] **symptom_agent immediate scan trigger** — Send a high-symptom message via `POST /ask` for a patient whose risk score exceeds 0.8. Check server logs for `"Immediate scan triggered for patient ..."` to confirm the daemon thread fires correctly.

---

## 1. Add Real API Keys (required for LLM agents to respond)

Edit `maya-backend/.env` and replace placeholders:

```
ANTHROPIC_API_KEY=sk-ant-...        # from console.anthropic.com
GROQ_API_KEY=gsk_...                # from console.groq.com (free fallback)
ELEVENLABS_API_KEY=...              # from elevenlabs.io (for voice)
```

Without `ANTHROPIC_API_KEY`, the health, emotion, general, and guardian agents
fall back to a hardcoded generic message. Emergency agent works without it.

---

## 2. Ingest PDFs into ChromaDB (required for RAG to work)

After setting API keys, run from `maya-backend/`:

```powershell
cd maya-backend
python ingest_all.py
```

This ingests all 9 PDFs in `docs/raw/` into ChromaDB. Takes ~10 minutes
(Claude Haiku contextualizes each chunk). To skip contextualization and
run instantly, add `CONTEXTUALIZE=false` to `.env` first.

Expected output: chunk counts for each PDF, e.g. `antenatal_care.pdf → 87 chunks`.

---

## 3. Browser-Test the Frontend

1. Start the backend: `cd maya-backend && python main.py`
2. Open `Maya.html` directly in a browser (no server needed — loads from file://)
3. Walk through: Splash → OTP → Register → Chat
4. Verify Tara responds with real LLM text (not "সমস্যা হচ্ছে")
5. Test voice: VoiceScreen → speak a message → check TTS plays audio
6. Test emergency: type "রক্তপাত হচ্ছে" → Tara should show alert emotion + hold

---

## 4. Test MCP Servers

Start all three servers together:

```powershell
# Terminal 1
cd maya-backend && python main.py

# Terminal 2
cd maya-backend && python mcp/knowledge_server.py

# Terminal 3
cd maya-backend && python mcp/patient_server.py
```

Or use the convenience script:
```powershell
.\run_all.ps1
```

Then verify:
```powershell
# Knowledge server health
Invoke-RestMethod http://localhost:8001/health

# Patient server health
Invoke-RestMethod http://localhost:8002/health
```

---

## 5. Import n8n Workflows (optional, for SMS/email automation)

1. Install and start n8n: `npx n8n`
2. Open n8n at `http://localhost:5678`
3. Import each JSON from `maya-backend/n8n/workflows/`:
   - `01_document_ingestion.json`
   - `02_daily_reminders.json`
   - `03_emergency_alert.json`
   - `04_weekly_report.json`
   - `05_missed_appointment.json`
4. Set the Maya backend URL in each workflow's HTTP node to `http://localhost:8000`

---

## 6. Production Checklist (before going live)

- [ ] Remove `print(f"[OTP] {phone} -> {otp}")` from `main.py` line 139 — exposes OTP in logs
- [ ] Replace `allow_origins=["*"]` in CORS with your actual frontend domain
- [ ] Set `SSL_WIRELESS_API_TOKEN` in `.env` for real SMS delivery
- [ ] Change `MCP_API_KEY` from default value in `.env`
- [ ] Switch SQLite to PostgreSQL for multi-instance deployments (`DATABASE_URL=postgresql://...`)
- [ ] Add a real token validation middleware to `/ask` (currently no auth on chat endpoint)
- [ ] Set `DEBUG=False` in `.env`
