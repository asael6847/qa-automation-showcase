"""Runner de la suite Playwright como subprocess, con salida hacia el buffer.

Decisión de concurrencia (el "por qué"):

  - Lanzar la suite y leer su stdout es **I/O bloqueante** (un `readline` que
    espera a que el proceso emita). Si lo hiciéramos en el event loop de asyncio,
    bloquearíamos a todos los demás requests.
  - Por eso el subprocess se lee en un **hilo** del `ThreadPoolExecutor`: el hilo
    se bloquea en `readline` sin afectar al loop, y empuja cada línea al
    `execution_buffer` (que es thread-safe).
  - El endpoint async (execute.py) consume del buffer en un bucle que cede el
    control con `await asyncio.sleep(...)`, de modo que el servidor sigue
    atendiendo otras peticiones mientras transmite los logs en vivo.

Productor (hilo) y consumidor (coroutine) se comunican sólo a través del buffer.
"""

from __future__ import annotations

import os
import subprocess
from concurrent.futures import ThreadPoolExecutor

from app.core.config import get_settings
from app.core.execution_buffer import execution_buffer

# Pool pequeño: las corridas E2E son pesadas; no queremos lanzar muchas a la vez.
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="suite-runner")


def _build_cmd(headed: bool) -> str:
    """Comando final según el modo.

    - Supervisado (headed): corre el flujo de evidencia (pasos numerados +
      resaltado + PDF) con navegador visible. El `--` reenvía `--headed` a
      Playwright a través de pnpm.
    - Desatendido (headless): corre la suite completa tal cual.
    """
    settings = get_settings()
    if headed:
        return f"{settings.evidence_cmd} -- --headed"
    return settings.run_tests_cmd


def _run_blocking(execution_id: str, headed: bool) -> None:
    """Corre la suite y vuelca su salida al buffer. Se ejecuta en un hilo."""
    settings = get_settings()
    cmd = _build_cmd(headed)
    execution_buffer.start(execution_id)
    execution_buffer.append(execution_id, f"$ {cmd}")

    # En modo supervisado exportamos PW_SLOWMO (velocidad de las acciones) y
    # EVIDENCE_DWELL_MS (cuánto permanece visible el resaltado numerado de cada
    # paso), para que la corrida se vea a velocidad humana y se lean los pasos.
    env = dict(os.environ)
    if headed:
        env["PW_SLOWMO"] = str(settings.headed_slowmo_ms)
        env["EVIDENCE_DWELL_MS"] = str(settings.headed_dwell_ms)

    try:
        process = subprocess.Popen(
            cmd,
            shell=True,
            cwd=settings.monorepo_root,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # mezclamos stderr en el mismo stream.
            text=True,
            bufsize=1,  # line-buffered.
        )
        assert process.stdout is not None
        for raw in process.stdout:
            execution_buffer.append(execution_id, raw.rstrip("\n"))
        process.wait()
        execution_buffer.append(execution_id, f"__EXIT__ {process.returncode}")
    except Exception as exc:  # noqa: BLE001 — reportamos el fallo como log.
        execution_buffer.append(execution_id, f"__ERROR__ {exc}")
    finally:
        execution_buffer.finish(execution_id)


def start_suite_run(execution_id: str, headed: bool = False) -> None:
    """Despacha la corrida al ThreadPool y retorna de inmediato (no bloquea).

    `headed=True` ejecuta con navegador visible (ejecución supervisada); por
    defecto corre headless (ejecución desatendida, en segundo plano).
    """
    _executor.submit(_run_blocking, execution_id, headed)
