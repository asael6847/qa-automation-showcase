import { Actor, BrowseTheWeb, Task } from '@screenplay';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';

/**
 * Task: navegar del inventario al primer paso del checkout (carrito → checkout).
 * Aislar este paso permite a un spec verificar el carrito antes de continuar.
 */
export class ProceedToCheckout implements Task {
  static now(): ProceedToCheckout {
    return new ProceedToCheckout();
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    await page.click(InventoryPage.shoppingCartLink);
    await page.click(CartPage.checkoutButton);
  }
}
