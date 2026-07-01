import { Actor, BrowseTheWeb, Task } from '@screenplay';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

/**
 * Task de alto nivel: completa el checkout end-to-end asumiendo que ya hay al
 * menos un producto en el carrito. Encapsula la navegación carrito → datos →
 * finalizar, de modo que el spec exprese sólo la intención.
 */
export class Checkout implements Task {
  private constructor(
    private readonly firstName: string,
    private readonly lastName: string,
    private readonly postalCode: string,
  ) {}

  static withCustomerDetails(firstName: string, lastName: string, postalCode: string): Checkout {
    return new Checkout(firstName, lastName, postalCode);
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();

    // Carrito → checkout.
    await page.click(InventoryPage.shoppingCartLink);
    await page.click(CartPage.checkoutButton);

    // Datos del comprador.
    await page.fill(CheckoutPage.firstNameInput, this.firstName);
    await page.fill(CheckoutPage.lastNameInput, this.lastName);
    await page.fill(CheckoutPage.postalCodeInput, this.postalCode);
    await page.click(CheckoutPage.continueButton);

    // Confirmación final.
    await page.click(CheckoutPage.finishButton);
  }
}
