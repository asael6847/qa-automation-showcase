import type { TestCaseResult } from '@/lib/report';
import { StatusDot } from './StatusBadge';

/** Tabla de specs/tests con semáforo de estado y duración. */
export function ResultsTable({ tests }: { tests: TestCaseResult[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Test</th>
            <th className="px-4 py-3 hidden md:table-cell">Archivo</th>
            <th className="px-4 py-3 text-right">Duración</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {tests.map((t, i) => (
            <tr key={`${t.file}-${i}`} className="hover:bg-slate-900/40">
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusDot outcome={t.outcome} />
              </td>
              <td className="px-4 py-3 text-slate-200">{t.title}</td>
              <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-slate-400">
                {t.file}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                {(t.durationMs / 1000).toFixed(2)}s
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
