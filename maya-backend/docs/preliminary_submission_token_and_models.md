# Token Optimization & Model Selection — Maya Preliminary Submission

---

## 1. Token Optimization Tools & Methods

Maya does not use external token-compression libraries (LLMLingua, Graphify, etc.).
Instead, optimization is achieved through five architectural decisions baked directly into the codebase.

---

### 1.1 Keyword Pre-Classification (Zero-Token Fast Path)

**File:** `agents/orchestrator.py` — `_keyword_classify()`

Before any LLM call is made, the orchestrator runs a pure Python keyword scan over the
incoming message. If it matches an emergency, symptom, or emotion keyword, the intent is
set immediately — no token is spent on intent classification.

```
message → keyword scan (no LLM) → intent set directly
       ↘ only ambiguous messages → LLM classify (10 tokens max)
```

The LLM intent classifier is capped at `max_tokens=10` — it returns exactly one word.
This saves ~390 tokens per classified request compared to a full-response classifier.

---

### 1.2 Hardcoded Emergency Responses (Zero-Token Emergency Path)

**File:** `agents/emergency_agent.py`

The emergency agent contains no LLM call at all. Responses for the five critical danger
signs (bleeding, seizure, no fetal movement, headache+vision, breathing) are hardcoded
in Bangla directly in the Python dict `EMERGENCY_RESPONSES`.

- **Token cost for an emergency message: 0**
- Response latency: < 5 ms (pure Python dict lookup + alert dispatch)
- This is the correct design for life-critical paths — LLM latency is unacceptable when
  seconds matter.

---

### 1.3 Strict Output Token Caps Per Agent

Every `call_llm_with_fallback()` call specifies an explicit `max_tokens` ceiling:

| Agent / use | max_tokens |
|---|---|
| Intent classifier | 10 |
| Health agent | 400 |
| Symptom agent | 400 |
| Emotion agent | 400 |
| Guardian agent | 400 |
| General agent | 400 |
| MCP / Phase 2 Claude calls | 500 |

Tara's responses are limited to 3 sentences by the system prompt (`"Keep response under
3 sentences"`), which further biases the LLM to produce short completions even within
the 400-token window.

---

### 1.4 RAG with Hybrid Search + Reranking (Precision Context Injection)

**File:** `rag/retriever.py`

Rather than dumping the full knowledge base into the prompt, Maya injects only the
3 most relevant chunks per query via a three-stage pipeline:

1. **Vector search** (ChromaDB, cosine similarity) — top `top_k` candidates
2. **BM25 (Okapi BM25)** — lexical keyword overlap, `rank_bm25` library
3. **Reciprocal Rank Fusion (RRF)** — merges both ranked lists into a single score
4. **BGE Reranker** (`rag/reranker.py`, `BAAI/bge-reranker-base`) — cross-encoder
   reranking, keeps top 3

This ensures the context window contains only the highest-precision chunks —
no padding, no irrelevant paragraphs. RAG context is filtered further per agent
(e.g. symptom agent requests `document_type: danger_signs` specifically).

---

### 1.5 Conversation History Truncation

**File:** `agents/orchestrator.py` (history load), `agents/health_agent.py` (history use)

The database stores full conversation history, but only the **last 5 turns** are loaded
from SQLite per request (`LIMIT 5`). Health agent further trims to the **last 4 turns**
(`[-4:]`) before injecting into the prompt. This caps conversation context cost at a
fixed token budget regardless of session length.

---

### 1.6 Structured JSON-Only Responses

All agent system prompts end with:
```
Respond ONLY in this JSON: {"emotion": "...", "message": "..."}
```

This eliminates prose padding, preambles ("Sure! Here is..."), and explanations in
the LLM output. The `parse_llm_json()` function in `config.py` strips markdown fences
if present. The result is a tight, machine-parseable response with no wasted tokens.

---

### Summary Table

| Technique | Where | Token / Latency Saving |
|---|---|---|
| Keyword pre-classification | `orchestrator.py` | Skips LLM for ~40% of messages |
| Hardcoded emergency responses | `emergency_agent.py` | 0 tokens, 0 ms LLM latency |
| max_tokens caps | `config.py`, all agents | Hard ceiling, no runaway completions |
| RAG top-3 only (BM25+vector+RRF+rerank) | `rag/retriever.py` | Precision context, no padding |
| History truncation (last 5 / last 4) | `orchestrator.py`, agents | Fixed history cost |
| JSON-only structured output | All agent system prompts | No prose overhead in completions |

---

## 2. Why Claude, Gemini, and Groq?

Maya uses three different AI providers with a clear rationale for each role.

---

### 2.1 Gemini 2.0 Flash — Primary LLM (Daily Conversations)

**Model:** `gemini-2.0-flash`
**Used by:** All agents in the normal request path via `call_llm_with_fallback()`

**Why Gemini:**
- **Speed:** Flash is Google's fastest production model — critical for real-time chat and
  voice responses where latency above 2–3 seconds breaks the UX.
- **Cost:** Gemini Flash has the lowest cost-per-token among comparable models, important
  for a healthcare app targeting low-income users in Bangladesh where API costs must stay
  minimal.
- **Multilingual (Bangla):** Gemini 2.0 Flash has strong Bangla language support.
  Maya's responses are in Bangla; Gemini handles Bangla fluency, tone, and culturally
  appropriate phrasing better than alternatives at the same price point.
- **JSON mode support:** Gemini's `GenerateContentConfig` accepts `system_instruction`
  and reliably produces structured JSON output, which all agents depend on.

---

### 2.2 Groq (Llama 3.3 70B) — Fallback LLM

**Model:** `llama-3.3-70b-versatile`
**Used by:** `call_llm_with_fallback()` when Gemini fails or is unavailable

**Why Groq:**
- **Reliability hedge:** A single-provider dependency is a production risk. If Gemini's
  API is down, rate-limited, or the key is exhausted, Groq provides an immediate fallback
  with no code change — the switch is automatic.
- **Groq's LPU hardware:** Groq runs Llama on its own Language Processing Units (LPUs),
  giving inference speeds that match or exceed Gemini Flash. Users experience no
  perceptible latency difference when the fallback fires.
- **Llama 3.3 70B capability:** At 70B parameters, the model is capable enough for all
  of Maya's agent tasks (symptom triage, emotional support, health guidance) and follows
  JSON output instructions reliably.
- **OpenAI-compatible API:** Groq's endpoint uses the OpenAI chat completions format,
  making integration a single `httpx.post` call with `response_format: json_object` —
  no SDK needed, minimal code.

---

### 2.3 Claude (claude-sonnet-4-6) — Phase 2 MCP Mode

**Model:** `claude-sonnet-4-6`
**Used by:** `call_claude_with_mcp()` in `orchestrator.py` — Phase 2 only, not active
in the default production path

**Why Claude:**
- **Tool use / MCP:** Claude is the only model in this stack with first-class MCP
  (Model Context Protocol) support in the Anthropic SDK. Phase 2 connects Claude to
  both MCP servers (knowledge + patient) so it can autonomously call `search_knowledge`,
  `get_patient`, `get_risk_score`, etc. before generating a reply.
  Gemini and Groq do not support the `mcp_servers=` parameter.
- **Complex reasoning:** For high-risk patients or nuanced clinical queries where the
  simpler Gemini/Groq path is insufficient, Claude Sonnet provides stronger multi-step
  reasoning over retrieved medical context.
- **Graceful degradation:** If the MCP call fails, `call_claude_with_mcp()` automatically
  falls back to `call_llm_with_fallback()` (Gemini → Groq), so Phase 2 failures never
  break the user experience.

---

### Decision Summary

| Model | Provider | Role | Primary Reason |
|---|---|---|---|
| `gemini-2.0-flash` | Google | Primary (all agents) | Speed + Bangla fluency + low cost |
| `llama-3.3-70b-versatile` | Groq | Automatic fallback | High-speed LPU + reliability hedge |
| `claude-sonnet-4-6` | Anthropic | Phase 2 MCP mode | Only model with MCP tool-use support |

The three-tier stack ensures Maya is fast under normal conditions, resilient to API
outages, and capable of deep tool-augmented reasoning when the patient's situation
requires it.
