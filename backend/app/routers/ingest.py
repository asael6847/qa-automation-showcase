"""Router de ingesta: recibe el JSON de Playwright y lo persiste vía ETL.

Esto es lo que el pipeline de CI llama tras correr la suite: hace POST con el
contenido de `results.json` y opcionalmente metadatos de git.
"""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.etl.loader import upsert_run
from app.etl.parser import parse_playwright_report
from app.models.test_run import TestRun
from app.schemas.test_run import IngestResponse, RunSummaryOut

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest_report(
    report: dict[str, Any],
    db: AsyncSession = Depends(get_db),
    run_id: str | None = Query(default=None),
    git_branch: str | None = Query(default=None),
    git_commit: str | None = Query(default=None),
) -> IngestResponse:
    """Parsea el reporte de Playwright y lo guarda (UPSERT idempotente)."""
    parsed = parse_playwright_report(
        report, run_id=run_id, git_branch=git_branch, git_commit=git_commit
    )
    await upsert_run(db, parsed)

    # Releemos la corrida persistida para devolver el estado real almacenado.
    stored = await db.scalar(select(TestRun).where(TestRun.run_id == parsed.run_id))
    return IngestResponse(ingested=True, run=RunSummaryOut.model_validate(stored))
