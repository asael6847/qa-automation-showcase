import type { RunSummary } from '@/lib/report';

interface CardProps {
  label: string;
  value: string | number;
  accent?: string;
}

function Card({ label, value, accent = 'text-slate-100' }: CardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

/** KPIs principales de la corrida: total, pasados, fallidos, % éxito, duración. */
export function SummaryCards({ run }: { run: RunSummary }) {
  const seconds = (run.durationMs / 1000).toFixed(1);
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <Card label="Total tests" value={run.total} />
      <Card label="Pasados" value={run.passed} accent="text-pass" />
      <Card label="Fallidos" value={run.failed} accent="text-fail" />
      <Card label="% de éxito" value={`${run.passRate}%`} accent="text-sky-400" />
      <Card label="Duración" value={`${seconds}s`} />
    </div>
  );
}
