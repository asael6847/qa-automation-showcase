"""Parser del reporte JSON de Playwright a una estructura propia normalizada.

El reporter `json` de Playwright produce suites anidadas. Aquí las aplanamos a
una lista de resultados y calculamos los agregados de la corrida. La salida es
un par de dataclasses simples que el loader inserta en PostgreSQL, manteniendo
el ETL desacoplado del ORM.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass
class ParsedResult:
    spec_file: str
    title: str
    status: str  # passed | failed | skipped | flaky
    duration_ms: float
    error_message: str | None = None
    retries: int = 0


@dataclass
class ParsedRun:
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
    results: list[ParsedResult] = field(default_factory=list)


def _walk_specs(suites: list[dict[str, Any]]) -> list[tuple[dict, str]]:
    """Recorre recursivamente las suites y devuelve (spec, file) de cada spec."""
    out: list[tuple[dict, str]] = []
    for suite in suites:
        file = suite.get("file", "unknown")
        for spec in suite.get("specs", []):
            out.append((spec, spec.get("file", file)))
        out.extend(_walk_specs(suite.get("suites", [])))
    return out


def _derive_outcome(spec: dict[str, Any]) -> tuple[str, float, str | None, int]:
    """Deriva (status, duration_ms, error, retries) de un spec de Playwright.

    Un spec tiene `tests[]`, cada uno con `results[]` (uno por intento). El
    `status` agregado del test ('expected'/'unexpected'/'flaky'/'skipped') nos
    dice el desenlace; sumamos las duraciones de todos los intentos.
    """
    test = (spec.get("tests") or [{}])[0]
    results = test.get("results") or []
    duration_ms = float(sum(r.get("duration", 0) for r in results))
    retries = max(len(results) - 1, 0)
    last = results[-1] if results else {}

    agg = test.get("status")
    if agg == "flaky":
        status = "flaky"
    elif agg == "skipped" or last.get("status") == "skipped":
        status = "skipped"
    elif spec.get("ok") and last.get("status") == "passed":
        status = "passed"
    else:
        status = "failed"

    error_message: str | None = None
    if status == "failed":
        msgs = [e.get("message", "") for e in last.get("errors", []) if e.get("message")]
        error_message = "\n".join(msgs) or None

    return status, duration_ms, error_message, retries


def _short_file(path: str) -> str:
    return path.split("/")[-1] if path else "unknown"


def parse_playwright_report(
    report: dict[str, Any],
    *,
    run_id: str | None = None,
    git_branch: str | None = None,
    git_commit: str | None = None,
) -> ParsedRun:
    """Normaliza un reporte de Playwright a un `ParsedRun`.

    Si no se provee `run_id`, se genera uno determinista-ish a partir del
    `startTime` + un sufijo uuid corto (legible y único por corrida).
    """
    stats = report.get("stats", {})
    started_raw = stats.get("startTime")
    started_at = (
        datetime.fromisoformat(started_raw.replace("Z", "+00:00"))
        if started_raw
        else datetime.now(UTC)
    )

    specs = _walk_specs(report.get("suites", []))
    results: list[ParsedResult] = []
    for spec, file in specs:
        status, duration_ms, error, retries = _derive_outcome(spec)
        results.append(
            ParsedResult(
                spec_file=_short_file(file),
                title=spec.get("title", ""),
                status=status,
                duration_ms=duration_ms,
                error_message=error,
                retries=retries,
            )
        )

    total = len(results)
    passed = sum(1 for r in results if r.status == "passed")
    failed = sum(1 for r in results if r.status == "failed")
    skipped = sum(1 for r in results if r.status == "skipped")
    flaky = sum(1 for r in results if r.status == "flaky")
    # Un flaky terminó pasando, así que cuenta como éxito.
    success_rate = round(((passed + flaky) / total) * 100, 2) if total else 0.0

    if not run_id:
        stamp = started_at.strftime("%Y%m%dT%H%M%S")
        run_id = f"run-{stamp}-{uuid.uuid4().hex[:8]}"

    return ParsedRun(
        run_id=run_id,
        started_at=started_at,
        total=total,
        passed=passed,
        failed=failed,
        skipped=skipped,
        flaky=flaky,
        duration_total_ms=float(stats.get("duration", 0.0)),
        success_rate=success_rate,
        git_branch=git_branch,
        git_commit=git_commit,
        results=results,
    )
