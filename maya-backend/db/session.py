from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL
from db.models import Base

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db():
    """Create all tables (idempotent) and apply lightweight column migrations."""
    Base.metadata.create_all(bind=engine)
    # Add archived column to proactive_messages if it doesn't exist yet (SQLite migration)
    with engine.connect() as conn:
        try:
            conn.execute(
                "ALTER TABLE proactive_messages ADD COLUMN archived BOOLEAN DEFAULT 0"
            )
            conn.commit()
        except Exception:
            pass  # Column already exists


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
