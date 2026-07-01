import { test, expect } from '../fixtures/actors';
import { Login } from '../tasks/Login';
import { AddProductToCart } from '../tasks/AddProductToCart';
import { Checkout } from '../tasks/Checkout';
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
});
