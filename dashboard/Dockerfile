# Multi-stage para Next.js en modo SSR (output: 'standalone').
# Contexto de build = raíz del monorepo (docker build -f dashboard/Dockerfile .)

# --- Stage 1: build ---
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

# La URL pública del backend se inyecta en build (NEXT_PUBLIC_* se hornea en el
# bundle del navegador, p. ej. para la página Live Run).
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY dashboard/package.json ./dashboard/package.json
COPY tests/package.json ./tests/package.json
RUN pnpm install --filter dashboard... --frozen-lockfile

COPY dashboard ./dashboard
RUN pnpm --filter dashboard build

# --- Stage 2: runtime mínimo ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# El output standalone trae su propio server.js y sólo las deps necesarias.
COPY --from=build /app/dashboard/.next/standalone ./
COPY --from=build /app/dashboard/.next/static ./dashboard/.next/static
COPY --from=build /app/dashboard/public ./dashboard/public

EXPOSE 3000
# server.js queda en dashboard/ por la estructura del monorepo en standalone.
CMD ["node", "dashboard/server.js"]
