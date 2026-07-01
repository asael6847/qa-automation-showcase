import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRunById } from '@/lib/data';
import { getAllRunsStatic } from '@/lib/report';
import { SummaryCards } from '@/components/SummaryCards';
import { ResultsTable } from '@/components/ResultsTable';
import { RunStatusBadge } from '@/components/StatusBadge';

// Las corridas conocidas en build (JSON estáticos) se pre-renderizan; las que
// sólo existan en el backend se renderizan on-demand (dynamicParams por defecto).
export function generateStaticParams() {
  return getAllRunsStatic().map((run) => ({ runId: run.id }));
}

// Se resuelve en cada request para reflejar el estado actual del backend.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ runId: string }>;
}

/** Detalle de una corrida: KPIs, tabla completa y errores de los fallidos. */
export default async function RunDetailPage({ params }: PageProps) {
  const { runId } = await params;
  const run = await getRunById(runId);

  if (!run) notFound();

  const failed = run.tests.filter((t) => t.outcome === 'failed');
  const runDate = new Date(run.startTime).toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="text-sm text-sky-400 hover:text-sky-300">
        ← Volver al dashboard
      </Link>

      <header className="mt-4 flex flex-col gap-3 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight">{run.id}</h1>
          <p className="mt-1 text-sm text-slate-400">{runDate}</p>
        </div>
        <RunStatusBadge status={run.status} />
      </header>

      <section className="mt-8">
        <SummaryCards run={run} />
      </section>

      {failed.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-fail">Tests fallidos ({failed.length})</h2>
          <div className="space-y-3">
            {failed.map((t, i) => (
              <div
                key={`${t.file}-${i}`}
                className="rounded-xl border border-fail/30 bg-fail/5 p-4"
              >
                <p className="font-medium text-slate-200">{t.title}</p>
                <p className="mt-1 font-mono text-xs text-slate-400">{t.file}</p>
                {t.error && (
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-fail/90">
                    {t.error}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Todos los tests</h2>
        <ResultsTable tests={run.tests} />
      </section>
    </main>
  );
}
