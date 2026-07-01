import { Actor, BrowseTheWeb, Question } from '@screenplay';
import { CheckoutPage } from '../pages/CheckoutPage';

/**
 * Question: los nombres de los artículos listados en el resumen de la orden
 * (paso 2 del checkout). Permite verificar que lo que se va a comprar coincide
 * exactamente con lo que se agregó al carrito, antes de finalizar.
 */
export class CheckoutOverviewItems implements Question<string[]> {
  static list(): CheckoutOverviewItems {
    return new CheckoutOverviewItems();
  }

  async answeredBy(actor: Actor): Promise<string[]> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    return page.locator(CheckoutPage.overviewItemName).allInnerTexts();
  }
}
