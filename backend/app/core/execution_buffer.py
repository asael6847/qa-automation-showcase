"""Buffer en memoria, thread-safe, para los logs de ejecuciones en vivo.

¿Por qué un buffer en memoria con TTL y no la base de datos? Porque los logs de
una corrida son efímeros y de alta frecuencia (muchas líneas por segundo): no
queremos un INSERT por línea. El buffer permite:

  - que el productor (un hilo que lee el stdout del subprocess) haga `append`,
  - que el consumidor (el endpoint async de streaming) haga `get(from_line)`
    para emitir sólo lo nuevo, y reconectarse sin perder líneas (replay).

Es thread-safe porque productor y consumidor viven en hilos distintos (ver
runner.py). Las ejecuciones se limpian tras `EXECUTION_TTL_HOURS` para no
crecer sin límite.
"""

from __future__ import annotations

import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

MAX_LINES_PER_EXECUTION = 5000
EXECUTION_TTL_HOURS = 24


@dataclass
class _Execution:
    lines: list[str] = field(default_factory=list)
    finished: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class ExecutionBuffer:
    """Almacén thread-safe de logs por execution_id."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._executions: dict[str, _Execution] = {}

    def start(self, execution_id: str) -> None:
        with self._lock:
            self._purge_expired_locked()
            self._executions[execution_id] = _Execution()

    def append(self, execution_id: str, line: str) -> None:
        with self._lock:
            ex = self._executions.get(execution_id)
            if ex is None or ex.finished:
                return
            # Cota dura para no agotar memoria con corridas patológicas.
            if len(ex.lines) < MAX_LINES_PER_EXECUTION:
                ex.lines.append(line)

    def finish(self, execution_id: str) -> None:
        with self._lock:
            ex = self._executions.get(execution_id)
            if ex is not None:
                ex.finished = True

    def get(self, execution_id: str, from_line: int = 0) -> tuple[list[str], bool]:
        """Devuelve (líneas nuevas desde `from_line`, terminado?)."""
        with self._lock:
            ex = self._executions.get(execution_id)
            if ex is None:
                return [], True
            return ex.lines[from_line:], ex.finished

    def get_latest(self) -> str | None:
        """El execution_id más reciente (por created_at)."""
        with self._lock:
            if not self._executions:
                return None
            return max(self._executions.items(), key=lambda kv: kv[1].created_at)[0]

    def tail(self, execution_id: str, n: int) -> list[str]:
        with self._lock:
            ex = self._executions.get(execution_id)
            return ex.lines[-n:] if ex else []

    def exists(self, execution_id: str) -> bool:
        with self._lock:
            return execution_id in self._executions

    def _purge_expired_locked(self) -> None:
        """Elimina ejecuciones más viejas que el TTL. Asume lock tomado."""
        cutoff = datetime.now(UTC) - timedelta(hours=EXECUTION_TTL_HOURS)
        expired = [eid for eid, ex in self._executions.items() if ex.created_at < cutoff]
        for eid in expired:
            del self._executions[eid]


# Singleton compartido por toda la app (un solo proceso/worker).
execution_buffer = ExecutionBuffer()
