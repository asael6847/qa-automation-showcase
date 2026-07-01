"""Fixtures de test.

Usamos SQLite async en memoria (aiosqlite) para no depender de un PostgreSQL
real en los tests. Un `StaticPool` mantiene una única conexión compartida, de
modo que la base en memoria persista entre sesiones dentro de un mismo test.

El lifespan de FastAPI (que llamaría a init_db contra Postgres) NO se dispara con
`ASGITransport`, así que el esquema lo creamos aquí explícitamente.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Any

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

import app.models.test_run  # noqa: F401 — registra los modelos en el metadata
from app.core.database import Base, get_db
from app.main import app


@pytest_asyncio.fixture
async def engine() -> AsyncGenerator[AsyncEngine, None]:
    eng = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def session(engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as s:
        yield s


@pytest_asyncio.fixture
async def client(engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with maker() as s:
            yield s

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


def sample_report(*, fail_one: bool = True) -> dict[str, Any]:
    """Un reporte mínimo con la forma del reporter JSON de Playwright."""
    checkout_ok = not fail_one
    return {
        "stats": {
            "startTime": "2026-06-24T19:44:56.031Z",
            "duration": 3886.9,
        },
        "suites": [
            {
                "title": "login.spec.ts",
                "file": "login.spec.ts",
                "specs": [
                    {
                        "title": "login exitoso",
                        "ok": True,
                        "file": "login.spec.ts",
                        "tests": [
                            {
                                "status": "expected",
                                "results": [{"status": "passed", "duration": 900}],
                            }
                        ],
                    }
                ],
                "suites": [],
            },
            {
                "title": "checkout.spec.ts",
                "file": "checkout.spec.ts",
                "specs": [
                    {
                        "title": "flujo completo de compra",
                        "ok": checkout_ok,
                        "file": "checkout.spec.ts",
                        "tests": [
                            {
                                "status": "expected" if checkout_ok else "unexpected",
                                "results": [
                                    {
                                        "status": "passed" if checkout_ok else "failed",
                                        "duration": 1100,
                                        "errors": (
                                            []
                                            if checkout_ok
                                            else [{"message": "expected 'Thank you'"}]
                                        ),
                                    }
                                ],
                            }
                        ],
                    }
                ],
                "suites": [],
            },
        ],
    }
