import type { Page } from '@playwright/test';

/**
 * Un paso de evidencia: número dentro de su prueba (arranca en 1 en cada una),
 * descripción legible y la captura de pantalla (PNG) que lo respalda.
 */
export interface EvidenceStep {
  index: number;
  description: string;
  screenshot: Buffer;
}

/** Una sección agrupa los pasos de una prueba; `number` es su "Prueba N.º". */
export interface EvidenceSection {
  number: number;
  title: string;
  steps: EvidenceStep[];
}

/** Rótulo de una prueba, tal como se muestra en pantalla y en el PDF. */
function labelFor(section: EvidenceSection): string {
  return `Prueba N.º ${section.number} · ${section.title}`;
}

/**
 * Grabador de evidencia de ejecución compartido por toda la suite. Cada test
 * abre una sección (`startSection`) que recibe su propio número de prueba, y
 * dentro de ella `capture` va registrando pasos numerados desde 1: resalta el
 * elemento con el que se interactúa (recuadro rojo + badge numerado) y rotula
 * la prueba y la descripción del paso, y toma una captura del viewport. Al
 * final todo se exporta a un único PDF (ver `pdf.ts`).
 *
 * Se trabaja sobre el viewport (no full-page) a propósito: así el overlay de
 * resaltado —posicionado con `position: fixed`— queda perfectamente alineado con
 * el elemento en la imagen, algo que no ocurre en capturas full-page.
 */
export class Evidence {
  private readonly sections: EvidenceSection[] = [];
  private total = 0;

  constructor(private readonly title: string) {}

  /** Abre una nueva prueba en el reporte y le asigna el siguiente número. */
  startSection(title: string): void {
    this.sections.push({ number: this.sections.length + 1, title, steps: [] });
  }

  /**
   * Cartel de presentación de la prueba en curso: se muestra sobre la página
   * antes del paso 1 para que, en la ejecución supervisada, se vea con claridad
   * qué prueba empieza. Sólo aparece si hay pausa configurada
   * (`EVIDENCE_DWELL_MS`); en headless no interrumpe nada.
   */
  async announceSection(page: Page): Promise<void> {
    const section = this.sections[this.sections.length - 1];
    if (!section) return;

    const dwell = this.dwellMs();
    if (dwell === 0) return;

    await page.evaluate(
      ({ kicker, title }) => {
        const CARD_ID = '__evidence_intro__';
        document.getElementById(CARD_ID)?.remove();

        const overlay = document.createElement('div');
        overlay.id = CARD_ID;
        overlay.style.cssText =
          'position:fixed;inset:0;z-index:2147483647;pointer-events:none;' +
          'display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.92);';

        const card = document.createElement('div');
        card.innerHTML =
          `<div style="font:700 13px/1 system-ui,sans-serif;letter-spacing:.14em;` +
          `text-transform:uppercase;color:#ef4444;margin-bottom:14px;">${kicker}</div>` +
          `<div style="font:600 30px/1.3 system-ui,-apple-system,sans-serif;color:#fff;">${title}</div>`;
        card.style.cssText =
          'text-align:center;padding:36px 48px;border-top:4px solid #ef4444;' +
          'background:#0f172a;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.5);max-width:80%;';

        overlay.appendChild(card);
        document.body.appendChild(overlay);
      },
      { kicker: `Prueba N.º ${section.number}`, title: section.title },
    );

    // El cartel merece más tiempo en pantalla que un paso normal: es lo que
    // separa visualmente una prueba de la siguiente.
    await page.waitForTimeout(Math.max(dwell * 2, 1200));
    await page.evaluate(() => document.getElementById('__evidence_intro__')?.remove());
  }

  /**
   * Captura un paso dentro de la prueba actual. Si se indica `targetSelector`,
   * se centra y resalta ese elemento con el número de paso; en cualquier caso se
   * rotula la prueba y la descripción.
   */
  async capture(page: Page, description: string, targetSelector?: string): Promise<void> {
    if (this.sections.length === 0) {
      this.startSection('General');
    }
    const section = this.sections[this.sections.length - 1];
    // Los pasos se numeran desde 1 en cada prueba; `total` sólo lleva la cuenta
    // global para la portada del PDF.
    const index = section.steps.length + 1;
    this.total++;
    const sectionLabel = labelFor(section);

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
      ({ rect, step, text, section }) => {
        const OVERLAY_ID = '__evidence_overlay__';
        document.getElementById(OVERLAY_ID)?.remove();

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';

        // Etiqueta inferior con la prueba, el número y la descripción del paso.
        const banner = document.createElement('div');
        banner.innerHTML =
          `<span style="opacity:.7">${section}</span> &nbsp;·&nbsp; ` +
          `<strong>Paso ${step}:</strong> ${text}`;
        banner.style.cssText =
          'position:fixed;left:0;right:0;bottom:0;background:#0f172a;color:#fff;' +
          'font:400 15px/1.4 system-ui,-apple-system,sans-serif;padding:12px 18px;' +
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
      { rect, step: index, text: description, section: sectionLabel },
    );

    const screenshot = await page.screenshot();

    // En ejecución supervisada dejamos el resaltado visible un instante para que
    // se pueda leer el paso a ojo. Se activa con EVIDENCE_DWELL_MS; en headless
    // sin la variable no hay pausa.
    const dwell = this.dwellMs();
    if (dwell > 0) {
      await page.waitForTimeout(dwell);
    }

    await page.evaluate(() => document.getElementById('__evidence_overlay__')?.remove());

    section.steps.push({ index, description, screenshot });
  }

  private dwellMs(): number {
    const dwell = Number(process.env.EVIDENCE_DWELL_MS ?? 0);
    return Number.isFinite(dwell) && dwell > 0 ? dwell : 0;
  }

  getTitle(): string {
    return this.title;
  }

  getSections(): readonly EvidenceSection[] {
    return this.sections;
  }

  getStepCount(): number {
    return this.total;
  }
}
