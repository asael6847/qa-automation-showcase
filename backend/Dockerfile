# Backend con toolchain COMPLETO: Python 3.11 (API + ETL) y Node/pnpm/Playwright
# (el runner del Live Run ejecuta la suite E2E dentro del contenedor).
#
# Imagen más pesada a propósito: a diferencia de la variante liviana, aquí el
# Live Run corre 100% en Docker (headless), sin necesidad de un backend local.
#
# IMPORTANTE: el contexto de build es la RAÍZ del monorepo (no ./backend), para
# poder copiar también el paquete `tests`. Ver docker-compose.yml.

FROM node:20-bookworm

# uv (gestor de entornos Python) desde su imagen oficial.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Python del sistema (para que uv construya el venv del backend).
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-venv ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# pnpm (mismo major que el workspace).
RUN npm install -g pnpm@9

WORKDIR /app

# 1) Dependencias del backend (capa cacheable mientras no cambie el lock).
COPY backend/pyproject.toml backend/uv.lock backend/README.md ./backend/
RUN cd backend && uv sync --frozen --no-dev --no-install-project

# 2) Dependencias JS del workspace, sólo las del paquete `tests` (cacheable).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tests/package.json ./tests/
COPY dashboard/package.json ./dashboard/
RUN pnpm install --frozen-lockfile --filter tests

# 3) Navegador de Playwright + dependencias del SO para la versión instalada.
RUN pnpm --filter tests exec playwright install --with-deps chromium

# 4) Código de la aplicación (backend + tests + scripts). node_modules queda
#    excluido por .dockerignore, así no pisa lo instalado en el paso 2.
COPY backend/app ./backend/app
RUN cd backend && uv sync --frozen --no-dev
COPY tests ./tests
COPY scripts ./scripts

# El venv del backend en el PATH; el runner encuentra el monorepo en /app.
ENV PATH="/app/backend/.venv/bin:$PATH" \
    MONOREPO_ROOT="/app"

EXPOSE 8000
# --app-dir añade /app/backend a sys.path para importar app.main.
CMD ["uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
