import { apiGetAllRuns, apiGetLatestRun, apiGetRunById } from './api';
import { getAllRunsStatic, getLatestRunStatic, getRunByIdStatic, type RunSummary } from './report';

/**
 * Capa de datos del dashboard con estrategia **backend-first, fallback a JSON**.
 *
 * Intentamos leer del backend FastAPI; si no responde (p. ej. está dormido en un
 * deploy, o no está levantado en local), caemos a los reportes JSON estáticos.
 * Así el dashboard nunca queda en blanco y sigue siendo desplegable solo.
 */

async function withFallback<T>(
  fromApi: () => Promise<T>,
  fromStatic: () => T,
  label: string,
): Promise<T> {
  try {
    return await fromApi();
  } catch (err) {
    // Log informativo en build/server; la UI no se entera del fallo.
    console.warn(`[data] backend no disponible para ${label}, usando JSON estáticos:`, String(err));
    return fromStatic();
  }
}

export async function getAllRuns(): Promise<RunSummary[]> {
  return withFallback(apiGetAllRuns, getAllRunsStatic, 'getAllRuns');
}

export async function getLatestRun(): Promise<RunSummary | null> {
  return withFallback(apiGetLatestRun, getLatestRunStatic, 'getLatestRun');
}

export async function getRunById(id: string): Promise<RunSummary | null> {
  return withFallback(
    () => apiGetRunById(id),
    () => getRunByIdStatic(id),
    `getRunById(${id})`,
  );
}
