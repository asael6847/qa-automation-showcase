import { test, expect } from '../fixtures/actors';
import { Login } from '../tasks/Login';
import { AddProductToCart } from '../tasks/AddProductToCart';
import { AddProductsToCart } from '../tasks/AddProductsToCart';
import { Checkout } from '../tasks/Checkout';
import { ProceedToCheckout } from '../tasks/ProceedToCheckout';
import { ProvideCheckoutDetails } from '../tasks/ProvideCheckoutDetails';
import { FinishPurchase } from '../tasks/FinishPurchase';
import { CartBadgeCount } from '../questions/CartBadgeCount';
import { CheckoutOverviewItems } from '../questions/CheckoutOverviewItems';
import { OrderConfirmation } from '../questions/OrderConfirmation';

const PASSWORD = 'secret_sauce';

test.describe('Checkout', () => {
  test('flujo completo de compra termina con orden confirmada', async ({ actor }) => {
    // El test se lee como la historia de usuario: ingresar, agregar, comprar.
    await actor.attemptsTo(
      Login.withCredentials('standard_user', PASSWORD),
      AddProductToCart.named('Sauce Labs Backpack'),
      Checkout.withCustomerDetails('Ana', 'Quishpe', '170101'),
    );

    expect(await actor.asks(OrderConfirmation.message())).toBe('Thank you for your order!');
  });

  test('compra de varios artículos se finaliza con la orden confirmada', async ({ actor }) => {
    const productos = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'];

    // Ingresar y llenar el carrito con varios artículos.
    await actor.attemptsTo(
      Login.withCredentials('standard_user', PASSWORD),
      AddProductsToCart.named(...productos),
    );

    // El badge del carrito refleja los tres artículos añadidos.
    expect(await actor.asks(CartBadgeCount.current())).toBe(productos.length);

    // Avanzar al resumen de la orden con los datos del comprador.
    await actor.attemptsTo(
      ProceedToCheckout.now(),
      ProvideCheckoutDetails.withCustomerDetails('Ana', 'Quishpe', '170101'),
    );

    // El resumen lista exactamente los artículos que se van a comprar.
    expect(await actor.asks(CheckoutOverviewItems.list())).toEqual(productos);

    // Finalizar la compra y confirmar el éxito del flujo completo.
    await actor.attemptsTo(FinishPurchase.now());
    expect(await actor.asks(OrderConfirmation.message())).toBe('Thank you for your order!');

    // Tras finalizar, el carrito queda vacío.
    expect(await actor.asks(CartBadgeCount.current())).toBe(0);
  });
});
