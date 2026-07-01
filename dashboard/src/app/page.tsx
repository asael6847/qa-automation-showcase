import Link from 'next/link';
import { getAllRuns } from '@/lib/data';
import { SummaryCards } from '@/components/SummaryCards';
import { PassFailChart } from '@/components/PassFailChart';
import { TrendChart, type TrendPoint } from '@/components/TrendChart';
import { ResultsTable } from '@/components/ResultsTable';
import { RunStatusBadge } from '@/components/StatusBadge';

/**
 * Dashboard principal (Server Component): renderiza la última corrida con KPIs,
 * donut de distribución, tendencia histórica y tabla de resultados. Todos los
 * datos se leen en build time desde los JSON estáticos.
 */
// Datos en cada request (el backend puede cambiar entre renders).
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const runs = await getAllRuns();
  const latest = runs[0];

  if (!latest) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-bold">QA Automation Showcase</h1>
        <p className="mt-4 text-slate-400">
          No hay corridas todavía. Ejecuta la suite y copia un reporte a{' '}
          <code className="font-mono text-slate-300">dashboard/public/runs/</code>.
        </p>
      </main>
    );
  }

  // La tendencia se lee de izquierda (antigua) a derecha (reciente).
  const trend: TrendPoint[] = [...runs].reverse().map((r) => ({
    label: new Date(r.startTime).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
    }),
    passRate: r.passRate,
  }));

  const runDate = new Date(latest.startTime).toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QA Automation Showcase</h1>
          <p className="mt-1 text-sm text-slate-400">
            Suite E2E con patrón Screenplay sobre SauceDemo · {runDate}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/live"
            className="rounded-full bg-sky-500/15 px-3 py-1 text-sm font-semibold text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-500/25"
          >
            ▶ Live Run
          </Link>
          <RunStatusBadge status={latest.status} />
        </div>
      </header>

      {/* KPIs */}
      <section className="mt-8">
        <SummaryCards run={latest} />
      </section>

      {/* Gráficas */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Distribución de resultados</h2>
          <PassFailChart
            passed={latest.passed}
            failed={latest.failed}
            skipped={latest.skipped}
            flaky={latest.flaky}
          />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Tendencia de % de éxito</h2>
          <TrendChart data={trend} />
        </div>
      </section>

      {/* Tabla + acceso al detalle */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Tests de la última corrida</h2>
          <Link href={`/runs/${latest.id}`} className="text-sm text-sky-400 hover:text-sky-300">
            Ver detalle de la corrida →
          </Link>
        </div>
        <ResultsTable tests={latest.tests} />
      </section>

      {/* Historial */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Historial de corridas</h2>
        <ul className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800">
          {runs.map((r) => (
            <li key={r.id}>
              <Link
                href={`/runs/${r.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-900/40"
              >
                <span className="font-mono text-slate-300">{r.id}</span>
                <span className="text-slate-400">
                  {new Date(r.startTime).toLocaleDateString('es-EC')}
                </span>
                <span className={r.status === 'PASSED' ? 'text-pass' : 'text-fail'}>
                  {r.passRate}% · {r.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500">
        Generado desde los reportes JSON de Playwright · Next.js + Recharts
      </footer>
    </main>
  );
}
