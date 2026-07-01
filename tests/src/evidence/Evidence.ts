import type { Page } from '@playwright/test';

/**
 * Un paso de evidencia: número secuencial, descripción legible y la captura de
 * pantalla (PNG) que lo respalda.
 */
export interface EvidenceStep {
  index: number;
  description: string;
  screenshot: Buffer;
}

/**
 * Grabador de evidencia de ejecución. Durante el recorrido de un test, `capture`
 * resalta el elemento con el que se va a interactuar (recuadro rojo + un badge
 * numerado) y una etiqueta con la descripción del paso, y toma una captura del
 * viewport. Al final, los pasos acumulados se exportan a un PDF (ver `pdf.ts`).
 *
 * Se trabaja sobre el viewport (no full-page) a propósito: así el overlay de
 * resaltado —posicionado con `position: fixed`— queda perfectamente alineado con
 * el elemento en la imagen, algo que no ocurre en capturas full-page.
 */
export class Evidence {
  private readonly steps: EvidenceStep[] = [];

  constructor(private readonly title: string) {}

  /**
   * Captura un paso. Si se indica `targetSelector`, se centra y resalta ese
   * elemento con el número de paso; en cualquier caso se rotula la descripción.
   */
  async capture(page: Page, description: string, targetSelector?: string): Promise<void> {
    const index = this.steps.length + 1;

    // Resolvemos el elemento con el locator de Playwright (entiende sus propios
    // selectores :has/:text-is, que no son CSS válido) y pasamos su rectángulo
    // al overlay. Así el resaltado funciona con cualquier selector de la suite.
    let rect: { x: number; y: number; width: number; height: number } | null = null;
    if (targetSelector) {
      const locator = page.locator(targetSelector).first();
      await locator.scrollIntoViewIfNeeded();
      rect = await locator.boundingBox();
    }

    await page.evaluate(
      ({ rect, step, text }) => {
        const OVERLAY_ID = '__evidence_overlay__';
        document.getElementById(OVERLAY_ID)?.remove();

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';

        // Etiqueta inferior con el número y la descripción del paso.
        const banner = document.createElement('div');
        banner.textContent = `Paso ${step}: ${text}`;
        banner.style.cssText =
          'position:fixed;left:0;right:0;bottom:0;background:#0f172a;color:#fff;' +
          'font:600 15px/1.4 system-ui,-apple-system,sans-serif;padding:12px 18px;' +
          'border-top:3px solid #ef4444;';
        overlay.appendChild(banner);

        if (rect) {
          const pad = 6;

          const box = document.createElement('div');
          box.style.cssText =
            `position:fixed;left:${rect.x - pad}px;top:${rect.y - pad}px;` +
            `width:${rect.width + pad * 2}px;height:${rect.height + pad * 2}px;` +
            'border:3px solid #ef4444;border-radius:8px;' +
            'box-shadow:0 0 0 3px rgba(239,68,68,.35);';
          overlay.appendChild(box);

          const badge = document.createElement('div');
          badge.textContent = String(step);
          badge.style.cssText =
            `position:fixed;left:${rect.x - pad - 14}px;top:${Math.max(rect.y - pad - 14, 4)}px;` +
            'width:28px;height:28px;border-radius:9999px;background:#ef4444;color:#fff;' +
            'font:700 15px/28px system-ui,sans-serif;text-align:center;' +
            'box-shadow:0 1px 4px rgba(0,0,0,.4);';
          overlay.appendChild(badge);
        }

        document.body.appendChild(overlay);
      },
      { rect, step: index, text: description },
    );

    const screenshot = await page.screenshot();

    // En ejecución supervisada dejamos el resaltado visible un instante para que
    // se pueda leer el paso a ojo. El runner exporta EVIDENCE_DWELL_MS en headed;
    // en headless/CI la variable no está y no hay pausa.
    const dwell = Number(process.env.EVIDENCE_DWELL_MS ?? 0);
    if (dwell > 0) {
      await page.waitForTimeout(dwell);
    }

    await page.evaluate(() => document.getElementById('__evidence_overlay__')?.remove());

    this.steps.push({ index, description, screenshot });
  }

  getTitle(): string {
    return this.title;
  }

  getSteps(): readonly EvidenceStep[] {
    return this.steps;
  }
}
