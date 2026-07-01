"""Carga de un `ParsedRun` a la base de datos de forma idempotente.

Idempotencia = reingestar la misma corrida (mismo `run_id`) no duplica datos ni
acumula resultados. Lo logramos con:

  - UPSERT real sobre `test_runs` (INSERT ... ON CONFLICT(run_id) DO UPDATE).
    Demuestra el patrón pedido y resuelve carreras de concurrencia mejor que un
    "select-then-insert".
  - Estrategia "replace" para los hijos `test_results`: se borran los de esa
    corrida y se reinsertan. Es simple y deja el estado final correcto aunque
    cambie el número de tests entre reingestas.

El `insert ... on_conflict` es específico de dialecto, así que elegimos el de
PostgreSQL o el de SQLite (tests) según el engine activo.
"""

from __future__ import annotations

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.etl.parser import ParsedRun
from app.models.test_run import TestResult, TestRun


def _dialect_insert(bind):
    """Devuelve la función `insert` del dialecto en uso (pg o sqlite)."""
    name = bind.dialect.name
    if name == "postgresql":
        return pg_insert
    if name == "sqlite":
        return sqlite_insert
    raise RuntimeError(f"Dialecto no soportado para UPSERT: {name}")


async def upsert_run(session: AsyncSession, parsed: ParsedRun) -> None:
    """Inserta o actualiza la corrida y reemplaza sus resultados. Idempotente."""
    insert = _dialect_insert(session.bind)

    run_values = {
        "run_id": parsed.run_id,
        "started_at": parsed.started_at,
        "total": parsed.total,
        "passed": parsed.passed,
        "failed": parsed.failed,
        "skipped": parsed.skipped,
        "flaky": parsed.flaky,
        "duration_total_ms": parsed.duration_total_ms,
        "success_rate": parsed.success_rate,
        "git_branch": parsed.git_branch,
        "git_commit": parsed.git_commit,
    }

    stmt = insert(TestRun).values(**run_values)
    # En conflicto de run_id, actualizamos todas las métricas (no el id ni run_id).
    stmt = stmt.on_conflict_do_update(
        index_elements=[TestRun.run_id],
        set_={k: v for k, v in run_values.items() if k != "run_id"},
    )
    await session.execute(stmt)

    # Replace de los resultados: borrar los previos de esta corrida...
    await session.execute(delete(TestResult).where(TestResult.run_id == parsed.run_id))
    # ...y reinsertar los actuales (si hay).
    if parsed.results:
        await session.execute(
            insert(TestResult),
            [
                {
                    "run_id": parsed.run_id,
                    "spec_file": r.spec_file,
                    "title": r.title,
                    "status": r.status,
                    "duration_ms": r.duration_ms,
                    "error_message": r.error_message,
                    "retries": r.retries,
                }
                for r in parsed.results
            ],
        )

    await session.commit()
