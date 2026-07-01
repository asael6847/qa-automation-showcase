import { Actor, BrowseTheWeb, Task } from '@screenplay';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Task: agregar un producto al carrito desde el inventario, identificándolo por
 * su nombre visible (más legible y estable que un índice).
 */
export class AddProductToCart implements Task {
  private constructor(private readonly productName: string) {}

  static named(productName: string): AddProductToCart {
    return new AddProductToCart(productName);
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    await page.click(InventoryPage.addToCartButton(this.productName));
  }
}
