import fs from 'node:fs';
import path from 'node:path';

/**
 * Capa de acceso a datos del dashboard.
 *
 * El dashboard no tiene backend ni base de datos: lee, en build time (Server
 * Components), los reportes JSON que produce el reporter `json` de Playwright.
 * Cada archivo en `public/runs/*.json` es una corrida histórica completa.
 *
 * Aquí tipamos sólo el subconjunto del reporte de Playwright que consumimos y
 * exponemos funciones que devuelven datos ya derivados (totales, %, listas),
 * para que los componentes de UI no tengan que conocer el formato crudo.
 */

// --- Tipos del subconjunto relevante del reporte JSON de Playwright ---

type PlaywrightTestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

interface PwError {
  message?: string;
}

interface PwResult {
  status: PlaywrightTestStatus;
  duration: number;
  errors?: PwError[];
}

interface PwTest {
  // 'expected' | 'unexpected' | 'flaky' | 'skipped' a nivel agregado del test.
  status: string;
  projectName?: string;
  results: PwResult[];
}

interface PwSpec {
  title: string;
  ok: boolean;
  file?: string;
  line?: number;
  tests: PwTest[];
}

interface PwSuite {
  title: string;
  file?: string;
  specs?: PwSpec[];
  suites?: PwSuite[];
}

interface PwReport {
  stats: {
    startTime: string;
    duration: number;
    expected: number;
    unexpected: number;
    skipped: number;
    flaky: number;
  };
  suites: PwSuite[];
}

// --- Tipos derivados que consume la UI ---

export type TestOutcome = 'passed' | 'failed' | 'skipped' | 'flaky';

export interface TestCaseResult {
  title: string;
  file: string;
  outcome: TestOutcome;
  durationMs: number;
  /** Mensaje de error (sólo presente en fallos). */
  error?: string;
}

export interface RunSummary {
  id: string;
  startTime: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  /** Porcentaje de éxito 0–100, redondeado. */
  passRate: number;
  /** Estado global de la corrida para el badge: PASSED si no hay fallos. */
  status: 'PASSED' | 'FAILED';
  tests: TestCaseResult[];
}

const RUNS_DIR = path.join(process.cwd(), 'public', 'runs');

/** Recorre recursivamente las suites y aplana todos los specs. */
function flattenSpecs(suites: PwSuite[], acc: { spec: PwSpec; file: string }[] = []) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      acc.push({ spec, file: spec.file ?? suite.file ?? 'unknown' });
    }
    if (suite.suites) flattenSpecs(suite.suites, acc);
  }
  return acc;
}

/** Normaliza el nombre de archivo a algo legible (sin ruta absoluta). */
function shortFile(file: string): string {
  return file.split('/').pop() ?? file;
}

/** Deriva el resultado de un spec a nuestro modelo de UI. */
function toTestCase(spec: PwSpec, file: string): TestCaseResult {
  const test = spec.tests[0];
  const lastResult = test?.results.at(-1);
  const durationMs = test?.results.reduce((sum, r) => sum + r.duration, 0) ?? 0;

  let outcome: TestOutcome;
  if (test?.status === 'flaky') {
    outcome = 'flaky';
  } else if (test?.status === 'skipped' || lastResult?.status === 'skipped') {
    outcome = 'skipped';
  } else if (spec.ok && lastResult?.status === 'passed') {
    outcome = 'passed';
  } else {
    outcome = 'failed';
  }

  const error =
    outcome === 'failed'
      ? lastResult?.errors
          ?.map((e) => e.message)
          .filter(Boolean)
          .join('\n')
      : undefined;

  return { title: spec.title, file: shortFile(file), outcome, durationMs, error };
}

/** Parsea un reporte crudo de Playwright a un RunSummary derivado. */
function parseReport(id: string, report: PwReport): RunSummary {
  const specs = flattenSpecs(report.suites);
  const tests = specs.map(({ spec, file }) => toTestCase(spec, file));

  const passed = tests.filter((t) => t.outcome === 'passed').length;
  const failed = tests.filter((t) => t.outcome === 'failed').length;
  const skipped = tests.filter((t) => t.outcome === 'skipped').length;
  const flaky = tests.filter((t) => t.outcome === 'flaky').length;
  const total = tests.length;

  // Un test flaky terminó pasando, así que cuenta como éxito para el passRate.
  const successful = passed + flaky;
  const passRate = total === 0 ? 0 : Math.round((successful / total) * 100);

  return {
    id,
    startTime: report.stats.startTime,
    durationMs: report.stats.duration,
    total,
    passed,
    failed,
    skipped,
    flaky,
    passRate,
    status: failed > 0 ? 'FAILED' : 'PASSED',
    tests,
  };
}

/**
 * Lee y parsea todas las corridas desde los JSON estáticos, ordenadas de más
 * reciente a más antigua. Es la **fuente de respaldo** (fallback) cuando el
 * backend no responde; ver `lib/data.ts`.
 */
export function getAllRunsStatic(): RunSummary[] {
  if (!fs.existsSync(RUNS_DIR)) return [];

  const files = fs.readdirSync(RUNS_DIR).filter((f) => f.endsWith('.json'));

  const runs = files.map((file) => {
    const id = file.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(RUNS_DIR, file), 'utf-8');
    return parseReport(id, JSON.parse(raw) as PwReport);
  });

  return runs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

/** La corrida más reciente desde los JSON estáticos (fallback). */
export function getLatestRunStatic(): RunSummary | null {
  return getAllRunsStatic()[0] ?? null;
}

/** Una corrida concreta por id desde los JSON estáticos (fallback). */
export function getRunByIdStatic(id: string): RunSummary | null {
  return getAllRunsStatic().find((r) => r.id === id) ?? null;
}
