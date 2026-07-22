"""Punto de entrada de la API FastAPI.

Crea la app, configura CORS para el dashboard, registra los routers y crea las
tablas en el arranque vía el lifespan.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db
from app.routers import execute, ingest, runs

settings = get_settings()
logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup: intenta asegurar el esquema. Si la DB no está disponible (p.ej. un
    # despliegue todavía sin DATABASE_URL válida), NO tumbamos la app: arrancamos
    # igual y `/api/v1/health` reporta "degraded". Así el Live Run headless (que
    # no toca la DB) sigue funcionando aunque la persistencia no esté lista.
    try:
        await init_db()
    except Exception as exc:  # noqa: BLE001 — degradar es preferible a no arrancar.
        logger.warning("init_db falló al arranque; la app sigue sin persistencia: %s", exc)
    yield
    # Shutdown: nada que limpiar (el engine cierra solo con el proceso).


app = FastAPI(
    title="QA Automation Showcase — Backend",
    description=(
        "ETL de reportes Playwright a PostgreSQL, API REST async y streaming "
        "de ejecuciones en vivo."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers versionados bajo /api/v1.
app.include_router(ingest.router, prefix="/api/v1", tags=["ingest"])
app.include_router(runs.router, prefix="/api/v1", tags=["runs"])
app.include_router(execute.router, prefix="/api/v1", tags=["execute"])


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "qa-showcase-backend", "docs": "/docs"}
