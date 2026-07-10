import { test as base } from '@playwright/test';
import path from 'node:path';
import { Evidence } from './Evidence';
import { generatePdf } from './pdf';

/**
 * Fixtures de evidencia. Un grabador `Evidence` con alcance de *worker* acumula
 * los pasos de TODOS los escenarios de la corrida; al terminar el worker (con
 * workers=1, al terminar toda la suite) se exporta un único PDF a `evidencias/`.
 *
 * El fixture `evidence` (alcance de test) abre una prueba numerada por cada test
 * con su título, de modo que el reporte quede organizado por prueba y los pasos
 * se numeren desde 1 en cada una.
 */
type WorkerFixtures = { evidenceRecorder: Evidence };
type TestFixtures = { evidence: Evidence };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  evidenceRecorder: [
    // eslint-disable-next-line no-empty-pattern -- Playwright exige el primer arg de fixtures.
    async ({}, use) => {
      const recorder = new Evidence('Suite E2E sobre SauceDemo — Evidencia de ejecución');
      await use(recorder);

      // Teardown del worker: generar el PDF combinado si hubo pasos.
      if (recorder.getStepCount() > 0) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
        const outPath = path.resolve(process.cwd(), '..', 'evidencias', `evidencia-suite-${stamp}.pdf`);
        await generatePdf(recorder, outPath);
        console.log(`Evidencia PDF generada en: ${outPath}`);
      }
    },
    { scope: 'worker' },
  ],

  evidence: async ({ page, evidenceRecorder }, use, testInfo) => {
    evidenceRecorder.startSection(testInfo.title);
    // Cartel con "Prueba N.º X — <título>" antes del paso 1 (sólo supervisada).
    await evidenceRecorder.announceSection(page);
    await use(evidenceRecorder);
  },
});

export { expect } from '@playwright/test';
