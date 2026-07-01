import type { TestOutcome } from '@/lib/report';

/** Semáforo de color reutilizable para el estado de un test o corrida. */
const STYLES: Record<TestOutcome, { dot: string; label: string; text: string }> = {
  passed: { dot: 'bg-pass', label: 'PASSED', text: 'text-pass' },
  failed: { dot: 'bg-fail', label: 'FAILED', text: 'text-fail' },
  flaky: { dot: 'bg-flaky', label: 'FLAKY', text: 'text-flaky' },
  skipped: { dot: 'bg-skip', label: 'SKIPPED', text: 'text-skip' },
};

export function StatusDot({ outcome }: { outcome: TestOutcome }) {
  const s = STYLES[outcome];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden />
      <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
    </span>
  );
}

/** Badge grande para el estado global de la última corrida (header). */
export function RunStatusBadge({ status }: { status: 'PASSED' | 'FAILED' }) {
  const passed = status === 'PASSED';
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-semibold ${
        passed
          ? 'bg-pass/15 text-pass ring-1 ring-pass/30'
          : 'bg-fail/15 text-fail ring-1 ring-fail/30'
      }`}
    >
      última corrida: {status}
    </span>
  );
}
