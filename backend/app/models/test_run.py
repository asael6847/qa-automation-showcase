"""Modelos ORM: una corrida (TestRun) y sus resultados (TestResult).

Relación 1-N con cascade: borrar una corrida borra sus resultados. Usamos UUID
en texto para portabilidad entre PostgreSQL y el SQLite async de los tests.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(UTC)


class TestRun(Base):
    __tablename__ = "test_runs"
    # Evita que pytest intente recolectar este modelo como clase de test.
    __test__ = False

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    # run_id es la clave de negocio sobre la que se hace el UPSERT idempotente.
    run_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    total: Mapped[int] = mapped_column(Integer, default=0)
    passed: Mapped[int] = mapped_column(Integer, default=0)
    failed: Mapped[int] = mapped_column(Integer, default=0)
    skipped: Mapped[int] = mapped_column(Integer, default=0)
    flaky: Mapped[int] = mapped_column(Integer, default=0)
    duration_total_ms: Mapped[float] = mapped_column(Float, default=0.0)
    success_rate: Mapped[float] = mapped_column(Float, default=0.0)

    git_branch: Mapped[str | None] = mapped_column(String(255), nullable=True)
    git_commit: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=_now
    )

    results: Mapped[list[TestResult]] = relationship(
        back_populates="run",
        cascade="all, delete-orphan",
        lazy="selectin",  # carga los resultados en la misma query (evita N+1).
    )


class TestResult(Base):
    __tablename__ = "test_results"
    # Evita que pytest intente recolectar este modelo como clase de test.
    __test__ = False

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("test_runs.run_id", ondelete="CASCADE"), index=True
    )

    spec_file: Mapped[str] = mapped_column(String(255), index=True)
    title: Mapped[str] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(16), index=True)
    duration_ms: Mapped[float] = mapped_column(Float, default=0.0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retries: Mapped[int] = mapped_column(Integer, default=0)

    run: Mapped[TestRun] = relationship(back_populates="results")


# Índice compuesto útil para filtrar resultados por corrida y estado.
Index("ix_test_results_run_status", TestResult.run_id, TestResult.status)
