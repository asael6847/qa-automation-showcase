import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QA Automation Showcase — Dashboard',
  description:
    'Dashboard de calidad que visualiza los reportes de la suite E2E (Playwright + patrón Screenplay) sobre SauceDemo.',
};

// Modo oscuro por defecto: fijamos la clase en <html> y el color-scheme en CSS.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}
