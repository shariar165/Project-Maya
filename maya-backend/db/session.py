from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL
from db.models import Base

# SQLite needs check_same_thread=False; PostgreSQL does not support that arg
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db():
    """Create all tables (idempotent) and apply lightweight column migrations."""
    from sqlalchemy import text as _text
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        for tbl, col, ddl in [
            ("conversations",      "session_id", "VARCHAR"),
            ("proactive_messages", "archived",   "BOOLEAN DEFAULT 0"),
            ("patients",           "theme",      "VARCHAR DEFAULT 'dawn'"),
            ("patients",           "notifications",  "TEXT"),
            ("patients",           "voice_settings", "TEXT"),
            ("patients",           "doctor_name",    "VARCHAR"),
            ("patients",           "doctor_email",   "VARCHAR"),
        ]:
            try:
                conn.execute(_text(f"ALTER TABLE {tbl} ADD COLUMN {col} {ddl}"))
                conn.commit()
            except Exception:
                pass  # column already exists


@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ── Redis ─────────────────────────────────────────────────────────────────────

_redis_client = None


async def get_redis():
    global _redis_client
    if _redis_client is None:
        import redis.asyncio as aioredis
        from config import REDIS_URL
        _redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


async def close_redis():
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
