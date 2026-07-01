# Multi-stage. Contexto de build = ./backend
#
# Nota sobre el runner de streaming: ingerir reportes (ETL) y la API REST corren
# 100% en esta imagen Python. El runner en vivo (/execute) lanza la suite
# Playwright, que requiere Node + pnpm + browsers; eso NO se incluye aquí para
# mantener la imagen liviana. El streaming en vivo está pensado para ejecutarse
# en local (donde está el toolchain JS). En Docker, /ingest + REST cubren el flujo.

# --- Stage 1: builder — crea el venv con uv ---
FROM python:3.11-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Instalamos sólo las deps primero (capa cacheable mientras no cambie el lock).
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project

# Ahora el código y el proyecto en sí.
COPY app ./app
RUN uv sync --frozen --no-dev

# --- Stage 2: runtime — imagen final mínima ---
FROM python:3.11-slim
WORKDIR /app

# Copiamos el venv ya construido y el código.
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/app /app/app
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
