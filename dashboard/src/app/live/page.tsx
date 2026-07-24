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
        El botón <strong className="text-slate-300">Sin supervisión</strong> corre la suite E2E
        headless en el backend de la nube y transmite los logs en vivo. El{' '}
        <strong className="text-slate-300">PDF de evidencia</strong> (con los pasos numerados y las
        capturas resaltadas) es una corrida real, descargable arriba. El modo{' '}
        <strong className="text-slate-300">con supervisión</strong> —navegador visible en cámara
        lenta— es una función del entorno local, ya que un servidor no tiene pantalla.
      </p>
    </main>
  );
}
