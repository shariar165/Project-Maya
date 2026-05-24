from pathlib import Path
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import CHROMA_PATH, GEMINI_API_KEY, GEMINI_MODEL
from rag.embedder import get_embedding

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=50,
    separators=["\n\n", "\n", "।", ".", " "],
)


def _get_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    return client.get_or_create_collection("maya_knowledge")


def contextualize_chunk(chunk: str, full_doc: str) -> str:
    """Enrich each chunk with 1-2 sentences of document-level context using Gemini."""
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = (
            f"Document:\n<document>{full_doc[:2000]}</document>\n\n"
            f"Chunk to contextualize:\n<chunk>{chunk}</chunk>\n\n"
            "Write 1-2 sentences explaining what this chunk covers and "
            "how it fits in the document. Output only those sentences."
        )
        return client.models.generate_content(model=GEMINI_MODEL, contents=prompt).text.strip()
    except Exception as e:
        print(f"[Ingest] Contextualization failed ({e}), using chunk as-is.")
        return ""


def ingest_pdf(pdf_path: str, metadata: dict, contextualize: bool = True):
    """Ingest a PDF into ChromaDB with optional contextual enrichment."""
    import fitz  # PyMuPDF

    collection = _get_collection()
    stem       = Path(pdf_path).stem
    doc        = fitz.open(pdf_path)
    text       = "\n".join(page.get_text() for page in doc)
    doc.close()

    if not text.strip():
        print(f"[Ingest] WARNING: No text extracted from {pdf_path}")
        return

    chunks = _splitter.split_text(text)
    print(f"[Ingest] {Path(pdf_path).name} -> {len(chunks)} chunks")

    for i, chunk in enumerate(chunks):
        chunk_id = f"{stem}_{i}"

        # Skip if already ingested
        existing = collection.get(ids=[chunk_id])
        if existing["ids"]:
            continue

        if contextualize:
            ctx     = contextualize_chunk(chunk, text)
            enriched = f"{ctx}\n\n{chunk}" if ctx else chunk
        else:
            enriched = chunk

        embedding = get_embedding(enriched)
        collection.add(
            ids=[chunk_id],
            embeddings=[embedding],
            documents=[enriched],
            metadatas=[{
                **metadata,
                "source":    Path(pdf_path).name,
                "chunk_idx": i,
            }],
        )

    print(f"[Ingest] Done: {len(chunks)} chunks stored for {Path(pdf_path).name}")
