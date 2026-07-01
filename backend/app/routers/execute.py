"""Endpoints de ejecución en vivo: dispara la suite y transmite sus logs.

`POST /execute` arranca una corrida y devuelve un StreamingResponse que emite
las líneas conforme aparecen en el buffer. `GET /execute/{id}/replay` re-emite
lo ya bufferizado para reconexiones sin pérdida.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.execution_buffer import execution_buffer
from app.services.runner import start_suite_run

router = APIRouter()

# Cadencia de polling del buffer. Suficientemente baja para que se sienta "vivo",
# suficientemente alta para no quemar CPU.
_POLL_INTERVAL_S = 0.25
# Sentinel que marca el fin del stream para el cliente.
_DONE_SENTINEL = "__DONE__"


async def _stream_lines(execution_id: str, from_line: int = 0) -> AsyncGenerator[str, None]:
    """Emite líneas nuevas del buffer hasta que la ejecución termina.

    El `await asyncio.sleep` es clave: cede el control del event loop entre
    sondeos, permitiendo que el servidor atienda otras peticiones mientras este
    cliente recibe su stream.
    """
    cursor = from_line
    while True:
        lines, finished = execution_buffer.get(execution_id, cursor)
        for line in lines:
            yield line + "\n"
        cursor += len(lines)

        if finished:
            # Drena cualquier línea que haya entrado justo antes de marcar fin.
            tail, _ = execution_buffer.get(execution_id, cursor)
            for line in tail:
                yield line + "\n"
            yield _DONE_SENTINEL + "\n"
            return

        await asyncio.sleep(_POLL_INTERVAL_S)


@router.post("/execute")
async def execute_suite(
    headed: bool = Query(
        default=False,
        description="True = ejecución supervisada (navegador visible). "
        "False = ejecución desatendida (headless, segundo plano).",
    ),
) -> StreamingResponse:
    """Arranca la suite Playwright y transmite sus logs en vivo (text/plain)."""
    execution_id = f"exec-{uuid.uuid4().hex[:12]}"
    start_suite_run(execution_id, headed=headed)
    return StreamingResponse(
        _stream_lines(execution_id),
        media_type="text/plain",
        headers={"X-Execution-Id": execution_id},
    )


@router.get("/execute/{execution_id}/replay")
async def replay_execution(
    execution_id: str,
    from_line: int = Query(default=0, ge=0),
) -> StreamingResponse:
    """Re-emite las líneas ya bufferizadas desde `from_line` (reconexión)."""
    if not execution_buffer.exists(execution_id):
        raise HTTPException(status_code=404, detail="Ejecución no encontrada o expirada")
    return StreamingResponse(
        _stream_lines(execution_id, from_line),
        media_type="text/plain",
        headers={"X-Execution-Id": execution_id},
    )
