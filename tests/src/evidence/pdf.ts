import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { Evidence } from './Evidence';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Genera un PDF de evidencia a partir de los pasos grabados: una portada con el
 * título y metadatos, y luego una página por paso (número, descripción y
 * captura). El PDF se renderiza con un Chromium headless propio, de modo que
 * funciona aunque el test se haya corrido en modo headed.
 */
export async function generatePdf(evidence: Evidence, outPath: string): Promise<string> {
  const steps = evidence.getSteps();

  const sections = steps
    .map(
      (s) => `
      <section class="step">
        <div class="cap"><span class="num">${s.index}</span>${escapeHtml(s.description)}</div>
        <img src="data:image/png;base64,${s.screenshot.toString('base64')}" alt="Paso ${s.index}" />
      </section>`,
    )
    .join('');

  const html = `<!doctype html>
  <html lang="es"><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; color: #0f172a; }
    .cover { padding: 64px 56px; }
    .cover h1 { font-size: 26px; margin: 0 0 12px; }
    .cover .sub { color: #475569; font-size: 14px; margin: 3px 0; }
    .cover .tag { display:inline-block; margin-top:16px; padding:6px 12px; border-radius:9999px;
      background:#ef4444; color:#fff; font-size:12px; font-weight:700; }
    .step { page-break-before: always; padding: 28px 32px; }
    .cap { font-size: 15px; font-weight: 600; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
    .num { display:inline-flex; width:26px; height:26px; border-radius:9999px; background:#ef4444;
      color:#fff; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex:none; }
    img { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; }
  </style></head><body>
    <div class="cover">
      <h1>${escapeHtml(evidence.getTitle())}</h1>
      <p class="sub">Evidencia de ejecución automatizada · SauceDemo</p>
      <p class="sub">Generado: ${new Date().toLocaleString('es-EC')}</p>
      <p class="sub">Total de pasos: ${steps.length}</p>
      <span class="tag">EVIDENCIA QA</span>
    </div>
    ${sections}
  </body></html>`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
    });
  } finally {
    await browser.close();
  }

  return outPath;
}
