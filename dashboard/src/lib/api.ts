import type { RunSummary, TestCaseResult, TestOutcome } from './report';

/**
 * Cliente del backend FastAPI. Mapea las respuestas del API a los mismos tipos
 * que ya consume la UI (`RunSummary`, `TestCaseResult`), de modo que los
 * componentes no distingan si los datos vienen del backend o de los JSON.
 */

/**
 * URL del backend para los fetches del **servidor** (SSR en data.ts).
 *
 * `API_INTERNAL_URL` se lee en runtime y permite que, dentro de Docker, el SSR
 * apunte al servicio interno (p. ej. http://backend:8000) mientras el navegador
 * usa la URL pública (`NEXT_PUBLIC_API_URL`, inyectada en build). Sin Docker,
 * ambos caen al default local. Este módulo es server-only (lo usa data.ts).
 */
export const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// --- Forma de las respuestas del backend ---

interface ApiResult {
  spec_file: string;
  title: string;
  status: string;
  duration_ms: number;
  error_message: string | null;
  retries: number;
}

interface ApiRun {
  run_id: string;
  started_at: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration_total_ms: number;
  success_rate: number;
  results?: ApiResult[];
}

function mapResult(r: ApiResult): TestCaseResult {
  return {
    title: r.title,
    file: r.spec_file,
    outcome: r.status as TestOutcome,
    durationMs: r.duration_ms,
    error: r.error_message ?? undefined,
  };
}

function mapRun(run: ApiRun): RunSummary {
  return {
    id: run.run_id,
    startTime: run.started_at,
    durationMs: run.duration_total_ms,
    total: run.total,
    passed: run.passed,
    failed: run.failed,
    skipped: run.skipped,
    flaky: run.flaky,
    passRate: Math.round(run.success_rate),
    status: run.failed > 0 ? 'FAILED' : 'PASSED',
    tests: (run.results ?? []).map(mapResult),
  };
}

// Timeout corto: si el backend está dormido, fallamos rápido y usamos el fallback.
async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    signal: AbortSignal.timeout(3000),
    // No cacheamos: queremos el estado actual del backend en cada render.
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API ${path} -> ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiGetAllRuns(): Promise<RunSummary[]> {
  const runs = await getJson<ApiRun[]>('/api/v1/runs?limit=50');
  return runs.map(mapRun);
}

export async function apiGetLatestRun(): Promise<RunSummary> {
  return mapRun(await getJson<ApiRun>('/api/v1/runs/latest'));
}

export async function apiGetRunById(id: string): Promise<RunSummary> {
  return mapRun(await getJson<ApiRun>(`/api/v1/runs/${id}`));
}
