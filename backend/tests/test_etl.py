"""Tests del ETL: parser + loader, incluyendo idempotencia del UPSERT."""

from sqlalchemy import func, select

from app.etl.loader import upsert_run
from app.etl.parser import parse_playwright_report
from app.models.test_run import TestResult, TestRun
from tests.conftest import sample_report


async def test_parser_deriva_agregados_correctos():
    parsed = parse_playwright_report(sample_report(fail_one=True), run_id="run-x")

    assert parsed.run_id == "run-x"
    assert parsed.total == 2
    assert parsed.passed == 1
    assert parsed.failed == 1
    assert parsed.success_rate == 50.0
    # El test fallido conserva su mensaje de error.
    failed = [r for r in parsed.results if r.status == "failed"][0]
    assert "Thank you" in (failed.error_message or "")


async def test_loader_persiste_run_y_resultados(session):
    parsed = parse_playwright_report(sample_report(), run_id="run-1")
    await upsert_run(session, parsed)

    run = await session.scalar(select(TestRun).where(TestRun.run_id == "run-1"))
    assert run is not None
    assert run.total == 2

    n_results = await session.scalar(
        select(func.count()).select_from(TestResult).where(TestResult.run_id == "run-1")
    )
    assert n_results == 2


async def test_upsert_es_idempotente(session):
    # Ingerimos la misma corrida dos veces...
    parsed = parse_playwright_report(sample_report(), run_id="run-dup")
    await upsert_run(session, parsed)
    await upsert_run(session, parsed)

    # ...y no se duplica ni la corrida ni sus resultados.
    n_runs = await session.scalar(
        select(func.count()).select_from(TestRun).where(TestRun.run_id == "run-dup")
    )
    n_results = await session.scalar(
        select(func.count()).select_from(TestResult).where(TestResult.run_id == "run-dup")
    )
    assert n_runs == 1
    assert n_results == 2


async def test_upsert_actualiza_metricas_al_reingestar(session):
    # Primera ingesta: checkout falla (success_rate 50%).
    await upsert_run(
        session, parse_playwright_report(sample_report(fail_one=True), run_id="run-up")
    )
    # Reingesta de la misma corrida ahora en verde (success_rate 100%).
    await upsert_run(
        session, parse_playwright_report(sample_report(fail_one=False), run_id="run-up")
    )

    run = await session.scalar(select(TestRun).where(TestRun.run_id == "run-up"))
    assert run.success_rate == 100.0
    assert run.failed == 0
