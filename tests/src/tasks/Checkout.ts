import { Actor, Task } from '@screenplay';
import { ProceedToCheckout } from './ProceedToCheckout';
import { ProvideCheckoutDetails } from './ProvideCheckoutDetails';
import { FinishPurchase } from './FinishPurchase';

/**
 * Task de alto nivel: completa el checkout end-to-end asumiendo que ya hay al
 * menos un producto en el carrito. Compone las tres tasks granulares (ir al
 * checkout → datos → finalizar), de modo que el spec exprese sólo la intención
 * y los pasos queden reutilizables por separado.
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
    await actor.attemptsTo(
      ProceedToCheckout.now(),
      ProvideCheckoutDetails.withCustomerDetails(this.firstName, this.lastName, this.postalCode),
      FinishPurchase.now(),
    );
  }
}
