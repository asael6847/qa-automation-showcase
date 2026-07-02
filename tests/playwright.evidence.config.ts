import base from './playwright.config';
import { defineConfig } from '@playwright/test';

/**
 * Config dedicada a la generación de evidencia. Vive aparte de la suite de CI:
 * sólo recoge los archivos `*.evidence.ts` de `src/evidence`, corre secuencial
 * y con un viewport fijo para que las capturas sean consistentes.
 */
export default defineConfig({
  ...base,
  testDir: './src/evidence',
  testMatch: /.*\.evidence\.ts$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // La ejecución supervisada es deliberadamente lenta (slowMo + dwell por paso);
  // ampliamos el timeout por test para que el flujo completo quepa holgado.
  timeout: 180_000,
  reporter: [['html', { open: 'never', outputFolder: 'evidence-report' }], ['list']],
  use: {
    ...base.use,
    viewport: { width: 1280, height: 800 },
  },
});
