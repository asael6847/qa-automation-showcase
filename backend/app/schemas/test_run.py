"""Schemas Pydantic de entrada/salida del API.

Separar los schemas de los modelos ORM nos deja controlar exactamente qué se
expone por la API (contrato estable) sin filtrar columnas internas.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TestResultOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    spec_file: str
    title: str
    status: str
    duration_ms: float
    error_message: str | None = None
    retries: int = 0


class RunSummaryOut(BaseModel):
    """Resumen de una corrida (sin la lista de resultados)."""

    model_config = ConfigDict(from_attributes=True)

    run_id: str
    started_at: datetime
    total: int
    passed: int
    failed: int
    skipped: int
    flaky: int
    duration_total_ms: float
    success_rate: float
    git_branch: str | None = None
    git_commit: str | None = None


class RunDetailOut(RunSummaryOut):
    """Corrida con todos sus resultados."""

    results: list[TestResultOut] = []


class TrendPointOut(BaseModel):
    run_id: str
    started_at: datetime
    success_rate: float
    duration_total_ms: float


class HealthOut(BaseModel):
    status: str
    database: str
    runs_count: int


class IngestResponse(BaseModel):
    """Respuesta de /ingest: el resumen de lo que se ingirió."""

    ingested: bool
    run: RunSummaryOut
