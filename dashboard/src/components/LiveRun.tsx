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
export function LiveRun() {
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);

  // Auto-scroll al fondo conforme llegan líneas.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  async function start() {
    setLines([]);
    setDone(false);
    setRunning(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/execute`, { method: 'POST' });
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
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={start}
          disabled={running}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Ejecutando…' : '▶ Ejecutar suite'}
        </button>
        {running && <span className="text-sm text-sky-300">streaming en vivo…</span>}
        {done && <span className="text-sm text-pass">✓ ejecución finalizada</span>}
      </div>

      <pre
        ref={logRef}
        className="h-[28rem] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300"
      >
        {lines.length === 0
          ? 'Pulsa "Ejecutar suite" para lanzar los tests y ver los logs en tiempo real.'
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
