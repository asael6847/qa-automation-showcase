import { Actor, BrowseTheWeb, Task } from '@screenplay';
import { CheckoutPage } from '../pages/CheckoutPage';

/**
 * Task: finalizar la compra pulsando "Finish" en el resumen de la orden. Es el
 * último paso del flujo; tras ejecutarla el actor ve la pantalla de confirmación.
 */
export class FinishPurchase implements Task {
  static now(): FinishPurchase {
    return new FinishPurchase();
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    await page.click(CheckoutPage.finishButton);
  }
}
