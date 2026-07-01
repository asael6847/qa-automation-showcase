import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright.
 *
 * El reporter `json` es la pieza que conecta esta suite con el dashboard:
 * genera `reports/results.json`, que `dashboard/lib/report.ts` parsea para
 * derivar KPIs y alimentar las gráficas. Por eso el outputFile es estable.
 */
export default defineConfig({
  testDir: './src/specs',
  // Falla el build si alguien deja un test.only olvidado en CI.
  forbidOnly: !!process.env.CI,
  // Un retry en CI absorbe flakiness de red contra un sitio público; 0 en local
  // para que el desarrollador vea los fallos reales sin enmascararlos.
  retries: process.env.CI ? 1 : 0,
  // Serializamos en CI para que el reporte sea determinista y fácil de leer.
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://www.saucedemo.com',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
    launchOptions: {
      // Retardo (ms) entre acciones. 0 en headless/CI; en ejecución supervisada
      // el backend exporta PW_SLOWMO para que la corrida se vea a ojo humano.
      slowMo: Number(process.env.PW_SLOWMO ?? 0),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox/WebKit quedan listos para activar; comentados para que la corrida
    // por defecto sea rápida en el portfolio.
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
