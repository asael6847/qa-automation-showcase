import { Actor, BrowseTheWeb, Task } from '@screenplay';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Task: remover un producto del carrito desde la propia página de inventario.
 * En SauceDemo, el botón "Add to cart" se convierte en "Remove" tras agregar,
 * así que apuntamos al mismo item por nombre.
 */
export class RemoveProductFromCart implements Task {
  private constructor(private readonly productName: string) {}

  static named(productName: string): RemoveProductFromCart {
    return new RemoveProductFromCart(productName);
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    // El botón Remove comparte el mismo selector de botón del item.
    await page.click(InventoryPage.addToCartButton(this.productName));
  }
}
