'use client';

import { useEffect, useRef, useState } from 'react';

// NEXT_PUBLIC_* se inyecta en el bundle del cliente en build time.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const DONE = '__DONE__';

/**
 * Dispara la suite en el backend (`POST /execute`) y muestra sus logs en vivo,
 * leyendo el cuerpo de la respuesta como un stream (ReadableStream + reader).
 * Esto demuestra el camino streaming end-to-end: subprocess → buffer → HTTP → UI.
 */
type RunMode = 'supervised' | 'unattended';

export function LiveRun() {
  const [lines, setLines] = useState<string[]>([]);
  // Modo en curso, o null si no hay ejecución activa.
  const [runningMode, setRunningMode] = useState<RunMode | null>(null);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);

  const running = runningMode !== null;

  // Auto-scroll al fondo conforme llegan líneas.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  async function start(mode: RunMode) {
    if (running) return;
    setLines([]);
    setDone(false);
    setRunningMode(mode);
    try {
      // supervised=true -> navegador visible + cámara lenta; false -> headless.
      const supervised = mode === 'supervised';
      const res = await fetch(`${API_URL}/api/v1/execute?supervised=${supervised}`, {
        method: 'POST',
      });
      if (!res.body) throw new Error('La respuesta no trae stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        // Emitimos por líneas completas; guardamos el resto parcial en el buffer.
        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';

        const clean = parts.filter((l) => l !== DONE);
        if (parts.includes(DONE)) setDone(true);
        if (clean.length) setLines((prev) => [...prev, ...clean]);
      }
    } catch (err) {
      setLines((prev) => [
        ...prev,
        `__ERROR__ No se pudo conectar al backend en ${API_URL}: ${String(err)}`,
      ]);
    } finally {
      setRunningMode(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {/* Con supervisión: navegador VISIBLE + cámara lenta (requiere backend host). */}
        <button
          onClick={() => start('supervised')}
          disabled={running}
          title="Ejecuta la suite E2E. El navegador visible en cámara lenta es una función del modo local; en la nube corre headless."
          className="flex-1 rounded-lg bg-sky-500 px-4 py-3 text-left text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="block text-sm font-semibold">
            {runningMode === 'supervised' ? 'Ejecutando…' : '▶ Con supervisión'}
          </span>
          <span className="block text-xs text-sky-100/80">
            Navegador visible · cámara lenta (modo local)
          </span>
        </button>

        {/* Sin supervisión: headless. */}
        <button
          onClick={() => start('unattended')}
          disabled={running}
          title="Ejecuta toda la suite E2E headless en el backend de la nube y transmite los logs en vivo."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="block text-sm font-semibold">
            {runningMode === 'unattended' ? 'Ejecutando…' : '◧ Sin supervisión'}
          </span>
          <span className="block text-xs text-slate-400">Headless · corre la suite E2E en la nube</span>
        </button>
      </div>

      {/* PDF de evidencia: artefacto real pre-generado de una corrida, servido
          estáticamente (la generación en vivo no cabe en el plan free del backend). */}
      <a
        href="/evidencia-suite.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-900/40"
      >
        ⬇ Descargar PDF de evidencia (corrida real)
      </a>

      <div className="flex items-center gap-3 text-sm">
        {runningMode === 'supervised' && (
          <span className="text-sky-300">navegador visible · cámara lenta · streaming…</span>
        )}
        {runningMode === 'unattended' && (
          <span className="text-sky-300">headless · streaming en vivo…</span>
        )}
        {done && <span className="text-pass">✓ ejecución finalizada</span>}
      </div>

      <pre
        ref={logRef}
        className="h-[28rem] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300"
      >
        {lines.length === 0
          ? 'Elige un modo de ejecución para lanzar los tests y ver los logs en tiempo real.'
          : lines.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith('__ERROR__')
                    ? 'text-fail'
                    : line.includes('passed') || line.startsWith('✓')
                      ? 'text-pass'
                      : line.includes('failed') || line.includes('✘')
                        ? 'text-fail'
                        : undefined
                }
              >
                {line}
              </div>
            ))}
      </pre>
    </div>
  );
}
