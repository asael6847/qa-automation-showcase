import { test as base } from '@playwright/test';
import { Actor, BrowseTheWeb } from '@screenplay';

/**
 * Fixture de Playwright que provee un `actor` ya equipado con la habilidad
 * `BrowseTheWeb` sobre la `page` del test. Centralizar la construcción del actor
 * aquí evita repetir el setup en cada spec y deja los tests enfocados en negocio.
 */
type ScreenplayFixtures = {
  actor: Actor;
};

export const test = base.extend<ScreenplayFixtures>({
  actor: async ({ page }, use) => {
    const actor = Actor.named('Ana').can(BrowseTheWeb.using(page));
    await use(actor);
  },
});

export { expect } from '@playwright/test';
