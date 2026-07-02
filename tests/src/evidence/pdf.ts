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
 * Genera un PDF de evidencia a partir de las secciones grabadas: una portada con
 * el título y metadatos, y luego, por cada escenario, una página por paso
 * (escenario, número, descripción y captura). El PDF se renderiza con un Chromium
 * headless propio, de modo que funciona aunque la suite se haya corrido headed.
 */
export async function generatePdf(evidence: Evidence, outPath: string): Promise<string> {
  const sections = evidence.getSections().filter((s) => s.steps.length > 0);
  const totalSteps = evidence.getStepCount();

  const body = sections
    .map(
      (section) => `
      ${section.steps
        .map(
          (s, i) => `
      <section class="step">
        <div class="scenario">${escapeHtml(section.title)}${
          i === 0 ? '' : ' (cont.)'
        }</div>
        <div class="cap"><span class="num">${s.index}</span>${escapeHtml(s.description)}</div>
        <img src="data:image/png;base64,${s.screenshot.toString('base64')}" alt="Paso ${s.index}" />
      </section>`,
        )
        .join('')}`,
    )
    .join('');

  const toc = sections
    .map((s) => `<li><strong>${escapeHtml(s.title)}</strong> — ${s.steps.length} pasos</li>`)
    .join('');

  const html = `<!doctype html>
  <html lang="es"><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; color: #0f172a; }
    .cover { padding: 56px; }
    .cover h1 { font-size: 26px; margin: 0 0 12px; }
    .cover .sub { color: #475569; font-size: 14px; margin: 3px 0; }
    .cover .tag { display:inline-block; margin:16px 0; padding:6px 12px; border-radius:9999px;
      background:#ef4444; color:#fff; font-size:12px; font-weight:700; }
    .cover ul { margin: 8px 0 0; padding-left: 20px; color:#334155; font-size: 14px; line-height: 1.6; }
    .step { page-break-before: always; padding: 26px 32px; }
    .scenario { font-size: 12px; font-weight: 700; letter-spacing:.04em; text-transform: uppercase;
      color:#ef4444; margin-bottom: 8px; }
    .cap { font-size: 15px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
    .num { display:inline-flex; width:26px; height:26px; border-radius:9999px; background:#ef4444;
      color:#fff; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex:none; }
    img { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; }
  </style></head><body>
    <div class="cover">
      <h1>${escapeHtml(evidence.getTitle())}</h1>
      <p class="sub">Evidencia de ejecución automatizada · SauceDemo</p>
      <p class="sub">Generado: ${new Date().toLocaleString('es-EC')}</p>
      <p class="sub">Escenarios: ${sections.length} · Pasos totales: ${totalSteps}</p>
      <span class="tag">EVIDENCIA QA</span>
      <ul>${toc}</ul>
    </div>
    ${body}
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
