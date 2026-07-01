import { Actor, BrowseTheWeb, Question } from '@screenplay';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Question: el texto del título de la página actual (p. ej. "Products" en el
 * inventario, "Your Cart" en el carrito). Útil para confirmar navegación.
 */
export class PageTitle implements Question<string> {
  static current(): PageTitle {
    return new PageTitle();
  }

  async answeredBy(actor: Actor): Promise<string> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    return (await page.locator(InventoryPage.title).textContent())?.trim() ?? '';
  }
}
