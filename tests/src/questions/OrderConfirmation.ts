import { Actor, BrowseTheWeb, Question } from '@screenplay';
import { CheckoutPage } from '../pages/CheckoutPage';

/**
 * Question: el mensaje de confirmación tras finalizar la compra
 * ("Thank you for your order!"). Confirma el éxito del flujo completo.
 */
export class OrderConfirmation implements Question<string> {
  static message(): OrderConfirmation {
    return new OrderConfirmation();
  }

  async answeredBy(actor: Actor): Promise<string> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    return (await page.locator(CheckoutPage.completeHeader).textContent())?.trim() ?? '';
  }
}
