import type { Page } from '@playwright/test';
import type { Ability } from './Ability';

/**
 * BrowseTheWeb es la habilidad que conecta al Actor con un navegador real,
 * envolviendo la `Page` de Playwright. Tasks y Questions nunca tocan la `Page`
 * directamente: la obtienen a través de esta habilidad. Así, si mañana
 * cambiáramos de herramienta, sólo esta clase tendría que adaptarse.
 *
 * El constructor es privado a propósito: se fuerza la creación semántica vía
 * `BrowseTheWeb.using(page)`, que se lee mejor en el fixture.
 */
export class BrowseTheWeb implements Ability {
  private constructor(private readonly page: Page) {}

  static using(page: Page): BrowseTheWeb {
    return new BrowseTheWeb(page);
  }

  /** Acceso a la Page para Tasks y Questions que la necesiten. */
  currentPage(): Page {
    return this.page;
  }
}
