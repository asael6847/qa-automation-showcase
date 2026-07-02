import Link from 'next/link';
import { LiveRun } from '@/components/LiveRun';

export const metadata = {
  title: 'Live Run — QA Automation Showcase',
};

/** Página "Live Run": ejecuta la suite en el backend y transmite sus logs. */
export default function LivePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/" className="text-sm text-sky-400 hover:text-sky-300">
        ← Volver al dashboard
      </Link>

      <header className="mt-4 border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Live Run</h1>
        <p className="mt-1 text-sm text-slate-400">
          Dispara la suite E2E en el backend y observa los logs en tiempo real (streaming HTTP). El
          runner corre Playwright como subprocess en un ThreadPool y empuja cada línea a un buffer
          que este cliente consume.
        </p>
      </header>

      <section className="mt-8">
        <LiveRun />
      </section>

      <p className="mt-6 text-xs text-slate-500">
        Nota: desde aquí la ejecución corre headless dentro del contenedor del backend y genera el PDF
        de evidencia (pasos numerados de toda la suite) en la carpeta{' '}
        <code className="font-mono text-slate-300">evidencias/</code>. Para ver el navegador en vivo y
        en cámara lenta, ejecuta en tu máquina{' '}
        <code className="font-mono text-slate-300">pnpm evidence:headed</code> (modo supervisado).
      </p>
    </main>
  );
}
