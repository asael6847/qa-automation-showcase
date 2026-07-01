import { Actor, Task } from '@screenplay';
import { AddProductToCart } from './AddProductToCart';

/**
 * Task compuesta: agrega varios productos al carrito por nombre. Delega en la
 * task unitaria `AddProductToCart`, demostrando la composición del patrón
 * Screenplay: una intención de alto nivel construida a partir de otras.
 */
export class AddProductsToCart implements Task {
  private constructor(private readonly productNames: string[]) {}

  static named(...productNames: string[]): AddProductsToCart {
    return new AddProductsToCart(productNames);
  }

  async performAs(actor: Actor): Promise<void> {
    await actor.attemptsTo(...this.productNames.map((name) => AddProductToCart.named(name)));
  }
}
