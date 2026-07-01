import { Actor, BrowseTheWeb, Question } from '@screenplay';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Question: ¿cuántos items marca el badge del carrito? Devuelve 0 cuando el
 * badge no está presente (carrito vacío), normalizando el "no existe" a número.
 */
export class CartBadgeCount implements Question<number> {
  static current(): CartBadgeCount {
    return new CartBadgeCount();
  }

  async answeredBy(actor: Actor): Promise<number> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    const badge = page.locator(InventoryPage.shoppingCartBadge);
    if ((await badge.count()) === 0) {
      return 0;
    }
    const text = (await badge.textContent())?.trim() ?? '0';
    return Number.parseInt(text, 10);
  }
}
