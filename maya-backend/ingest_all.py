"""
Run this after starting the server (or standalone) to ingest all PDFs into ChromaDB.
Each PDF is given appropriate metadata for filtering.
Set CONTEXTUALIZE=False to skip Claude Haiku calls (faster, no API key needed).
"""
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Change to backend dir so relative paths (chroma_db, models) resolve correctly
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from rag.ingest import ingest_pdf

DOCS_DIR       = "docs/raw"
CONTEXTUALIZE  = os.getenv("CONTEXTUALIZE", "true").lower() == "true"

PDF_METADATA = {
    "08-sn-139-original-beauty-rashedul-essential-neoborn-care.pdf": {
        "document_type": "neonatal_care",
        "language":      "en",
        "source":        "BD Health",
    },
    "american maternal mental health(national library of medicine).pdf": {
        "document_type": "mental_health",
        "language":      "en",
        "source":        "NLM",
    },
    "bd maternal health.pdf": {
        "document_type": "maternal_health",
        "language":      "en",
        "source":        "BD Gov",
    },
    "emergency guideline(bdpill).pdf": {
        "document_type": "danger_signs",
        "language":      "en",
        "source":        "DGHS",
    },
    "maternal health care(edu.bd).pdf": {
        "document_type": "anc_protocol",
        "language":      "en",
        "source":        "Bangladesh Edu",
    },
    "MNH-Service-Accreditation-Manual_Clean_Cor child care bd.pdf": {
        "document_type": "clinical_protocol",
        "language":      "en",
        "source":        "DGHS",
    },
    "Neonatal-Health-Strategy-BGD.pdf": {
        "document_type": "neonatal_care",
        "language":      "en",
        "source":        "BD Gov",
    },
    "who's feeding for child.pdf": {
        "document_type": "nutrition",
        "language":      "en",
        "source":        "WHO",
    },
    "who's posternal guide.pdf": {
        "document_type": "postpartum",
        "language":      "en",
        "source":        "WHO",
    },
}

if __name__ == "__main__":
    if not os.path.isdir(DOCS_DIR):
        print(f"[Ingest] ERROR: docs directory not found: {DOCS_DIR}")
        sys.exit(1)

    pdfs = [f for f in os.listdir(DOCS_DIR) if f.lower().endswith(".pdf")]
    print(f"[Ingest] Found {len(pdfs)} PDFs in {DOCS_DIR}")
    print(f"[Ingest] Contextualization: {'ON (uses Claude Haiku)' if CONTEXTUALIZE else 'OFF (faster)'}")
    print()

    for pdf_name in pdfs:
        pdf_path = os.path.join(DOCS_DIR, pdf_name)
        metadata = PDF_METADATA.get(pdf_name, {"document_type": "general", "language": "en", "source": "unknown"})
        try:
            ingest_pdf(pdf_path, metadata, contextualize=CONTEXTUALIZE)
        except Exception as e:
            print(f"[Ingest] ERROR on {pdf_name}: {e}")

    print()
    print("[Ingest] All PDFs processed. ChromaDB is ready.")
