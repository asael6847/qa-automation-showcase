import { Actor, BrowseTheWeb, Task } from '@screenplay';
import { CheckoutPage } from '../pages/CheckoutPage';

/**
 * Task: completar los datos del comprador (paso 1) y continuar al resumen de la
 * orden (paso 2). Deja al actor en la pantalla de overview, lista para verificar
 * los artículos y totales antes de finalizar.
 */
export class ProvideCheckoutDetails implements Task {
  private constructor(
    private readonly firstName: string,
    private readonly lastName: string,
    private readonly postalCode: string,
  ) {}

  static withCustomerDetails(
    firstName: string,
    lastName: string,
    postalCode: string,
  ): ProvideCheckoutDetails {
    return new ProvideCheckoutDetails(firstName, lastName, postalCode);
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    await page.fill(CheckoutPage.firstNameInput, this.firstName);
    await page.fill(CheckoutPage.lastNameInput, this.lastName);
    await page.fill(CheckoutPage.postalCodeInput, this.postalCode);
    await page.click(CheckoutPage.continueButton);
  }
}
