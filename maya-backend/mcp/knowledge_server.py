"""
MCP Server 1 — Maternal Knowledge (port 8001)
Exposes ChromaDB knowledge base tools for Claude to call directly.
"""
import json
import os
import sys

# Ensure the backend root is on the path when run standalone
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Header, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from rag.retriever import hybrid_search
from rag.ingest    import ingest_pdf
from mcp.shared.auth import verify_api_key

app = FastAPI(title="Maya Knowledge MCP Server", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def server_info():
    return {
        "name":        "maya-knowledge-mcp",
        "version":     "1.0",
        "description": "Maya maternal health knowledge base for Bangladesh",
        "tools":       _tool_definitions(),
    }


@app.get("/tools")
async def list_tools():
    return {"tools": _tool_definitions()}


@app.post("/tools/call")
async def call_tool(request: Request, x_api_key: str = Header(None)):
    verify_api_key(x_api_key)
    body      = await request.json()
    tool_name = body.get("name")
    args      = body.get("arguments", {})

    handlers = {
        "search_knowledge":   _search_knowledge,
        "get_week_info":      _get_week_info,
        "get_nutrition_info": _get_nutrition_info,
        "get_danger_signs":   _get_danger_signs,
        "ingest_document":    _ingest_document,
    }

    handler = handlers.get(tool_name)
    if not handler:
        raise HTTPException(status_code=404, detail=f"Unknown tool: {tool_name}")

    result = await handler(args)
    return {"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}]}


# ── Tool implementations ──────────────────────────────────────────────────────

async def _search_knowledge(args: dict) -> dict:
    query   = args.get("query", "")
    filters = args.get("filters")
    top_k   = int(args.get("top_k", 3))

    if not query:
        return {"error": "query is required", "results": []}

    try:
        chunks = hybrid_search(query, filters, top_k=top_k)
        return {"query": query, "results": chunks, "result_count": len(chunks)}
    except Exception as e:
        return {"error": str(e), "results": []}


async def _get_week_info(args: dict) -> dict:
    week = args.get("week")
    if not week:
        return {"error": "week is required"}

    week   = int(week)
    chunks = hybrid_search(
        f"pregnancy week {week} baby development mother changes",
        {"document_type": "week_guide"},
        top_k=3,
    )

    baby_sizes = {
        4: ("পোস্তদানা", "poppy seed"),   8: ("বরই", "raspberry"),
        12: ("লেবু", "lime"),             16: ("আভোকাডো", "avocado"),
        20: ("আম", "mango"),              24: ("ভুট্টা", "corn"),
        28: ("বাঁধাকপি", "cabbage"),      32: ("নারকেল", "coconut"),
        36: ("রোমেইন লেটুস", "romaine"), 40: ("তরমুজ", "watermelon"),
    }
    closest    = min(baby_sizes.keys(), key=lambda w: abs(w - week))
    bn, en     = baby_sizes[closest]

    return {
        "week":         week,
        "trimester":    1 if week <= 13 else (2 if week <= 26 else 3),
        "baby_size_bn": bn,
        "baby_size_en": en,
        "knowledge":    chunks,
    }


async def _get_nutrition_info(args: dict) -> dict:
    food      = args.get("food_name", "")
    trimester = args.get("trimester")
    query     = f"{food} nutrition pregnancy safe" + (f" trimester {trimester}" if trimester else "")
    chunks    = hybrid_search(query, {"document_type": "nutrition"}, top_k=3)
    return {"food": food, "trimester": trimester, "info": chunks}


async def _get_danger_signs(args: dict) -> dict:
    trimester = args.get("trimester", "all")
    chunks    = hybrid_search(
        f"danger signs warning symptoms trimester {trimester} emergency",
        {"document_type": "danger_signs"},
        top_k=5,
    )
    critical = [
        "ভারী রক্তপাত (heavy bleeding)",
        "খিঁচুনি (seizure/convulsion)",
        "শিশুর নড়াচড়া বন্ধ (no fetal movement)",
        "তীব্র মাথাব্যথা + দৃষ্টি সমস্যা (severe headache + vision problems)",
        "শ্বাসকষ্ট (difficulty breathing)",
        "মুখ/হাত/পা ফুলে যাওয়া (sudden swelling)",
    ]
    return {"trimester": trimester, "critical_signs": critical, "detailed_info": chunks}


async def _ingest_document(args: dict) -> dict:
    pdf_path = args.get("pdf_path")
    metadata = args.get("metadata", {})
    if not pdf_path:
        return {"error": "pdf_path is required"}
    try:
        ingest_pdf(pdf_path, metadata)
        return {"status": "success", "message": f"Ingested: {pdf_path}"}
    except Exception as e:
        return {"error": str(e), "status": "failed"}


def _tool_definitions() -> list:
    return [
        {
            "name": "search_knowledge",
            "description": "Search Maya's maternal health knowledge base. Supports Bangla and English.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query":   {"type": "string"},
                    "filters": {"type": "object"},
                    "top_k":   {"type": "integer"},
                },
                "required": ["query"],
            },
        },
        {
            "name": "get_week_info",
            "description": "Get pregnancy week-specific info — baby size, development, body changes.",
            "inputSchema": {
                "type": "object",
                "properties": {"week": {"type": "integer"}},
                "required": ["week"],
            },
        },
        {
            "name": "get_nutrition_info",
            "description": "Get nutrition info for Bangladeshi foods during pregnancy.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "food_name": {"type": "string"},
                    "trimester": {"type": "integer"},
                },
                "required": ["food_name"],
            },
        },
        {
            "name": "get_danger_signs",
            "description": "Get maternal danger signs and emergency indicators (DGHS-verified).",
            "inputSchema": {
                "type": "object",
                "properties": {"trimester": {"type": "string"}},
            },
        },
        {
            "name": "ingest_document",
            "description": "Ingest a new PDF into the Maya knowledge base.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "pdf_path": {"type": "string"},
                    "metadata": {"type": "object"},
                },
                "required": ["pdf_path"],
            },
        },
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
