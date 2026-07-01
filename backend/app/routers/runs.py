"""Endpoints de lectura desde PostgreSQL. Todo async."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.test_run import TestRun
from app.schemas.test_run import (
    HealthOut,
    RunDetailOut,
    RunSummaryOut,
    TrendPointOut,
)

router = APIRouter()


@router.get("/health", response_model=HealthOut)
async def health(db: AsyncSession = Depends(get_db)) -> HealthOut:
    """Estado de la conexión a la BD + número de corridas almacenadas."""
    try:
        count = await db.scalar(select(func.count()).select_from(TestRun))
        return HealthOut(status="ok", database="connected", runs_count=count or 0)
    except Exception:  # noqa: BLE001 — el health no debe romper, sólo reportar.
        return HealthOut(status="degraded", database="unavailable", runs_count=0)


@router.get("/runs", response_model=list[RunSummaryOut])
async def list_runs(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[TestRun]:
    """Lista de corridas (resumen), más recientes primero, paginada."""
    rows = await db.scalars(
        select(TestRun).order_by(TestRun.started_at.desc()).limit(limit).offset(offset)
    )
    return list(rows)


@router.get("/runs/latest", response_model=RunDetailOut)
async def latest_run(db: AsyncSession = Depends(get_db)) -> TestRun:
    """La corrida más reciente con todos sus resultados."""
    run = await db.scalar(select(TestRun).order_by(TestRun.started_at.desc()).limit(1))
    if not run:
        raise HTTPException(status_code=404, detail="No hay corridas todavía")
    return run


@router.get("/metrics/trend", response_model=list[TrendPointOut])
async def metrics_trend(
    db: AsyncSession = Depends(get_db),
    last: int = Query(default=10, ge=1, le=100),
) -> list[TrendPointOut]:
    """Serie temporal de success_rate y duración de las últimas N corridas.

    Consultamos las N más recientes y las devolvemos en orden cronológico
    ascendente, que es como la gráfica de tendencia las dibuja (izq→der).
    """
    rows = await db.scalars(select(TestRun).order_by(TestRun.started_at.desc()).limit(last))
    runs = list(rows)
    runs.reverse()
    return [
        TrendPointOut(
            run_id=r.run_id,
            started_at=r.started_at,
            success_rate=r.success_rate,
            duration_total_ms=r.duration_total_ms,
        )
        for r in runs
    ]


@router.get("/runs/{run_id}", response_model=RunDetailOut)
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)) -> TestRun:
    """Una corrida concreta con todos sus resultados."""
    run = await db.scalar(select(TestRun).where(TestRun.run_id == run_id))
    if not run:
        raise HTTPException(status_code=404, detail=f"Corrida '{run_id}' no encontrada")
    return run
