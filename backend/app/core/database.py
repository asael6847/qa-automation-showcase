"""Capa de base de datos: engine async, sesiones e inicialización.

SQLAlchemy 2 en modo async sobre asyncpg. Exponemos:
  - `engine` / `AsyncSessionLocal` para crear sesiones.
  - `get_db()` como dependencia de FastAPI (inyecta una sesión por request).
  - `init_db()` para crear las tablas en el arranque (suficiente para un
    portfolio; en producción se usaría Alembic para migraciones versionadas).
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    """Base declarativa para todos los modelos ORM."""


settings = get_settings()

# `pool_pre_ping` evita usar conexiones muertas tras inactividad.
engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)

AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependencia FastAPI: una sesión async por request, cerrada al terminar."""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """Crea las tablas si no existen. Se llama en el startup de la app."""
    # Import local para registrar los modelos en el metadata antes del create_all.
    from app.models import test_run  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
