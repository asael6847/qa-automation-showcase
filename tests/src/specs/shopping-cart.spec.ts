import { test, expect } from '../fixtures/actors';
import { Login } from '../tasks/Login';
import { AddProductToCart } from '../tasks/AddProductToCart';
import { RemoveProductFromCart } from '../tasks/RemoveProductFromCart';
import { CartBadgeCount } from '../questions/CartBadgeCount';

const PASSWORD = 'secret_sauce';

test.describe('Carrito de compras', () => {
  // Todas las pruebas parten de una sesión iniciada en el inventario.
  test.beforeEach(async ({ actor }) => {
    await actor.attemptsTo(Login.withCredentials('standard_user', PASSWORD));
  });

  test('agregar 1 producto deja el badge en 1', async ({ actor }) => {
    await actor.attemptsTo(AddProductToCart.named('Sauce Labs Backpack'));

    expect(await actor.asks(CartBadgeCount.current())).toBe(1);
  });

  test('agregar varios productos refleja la cantidad correcta', async ({ actor }) => {
    await actor.attemptsTo(
      AddProductToCart.named('Sauce Labs Backpack'),
      AddProductToCart.named('Sauce Labs Bike Light'),
      AddProductToCart.named('Sauce Labs Bolt T-Shirt'),
    );

    expect(await actor.asks(CartBadgeCount.current())).toBe(3);
  });

  test('remover un producto actualiza el badge', async ({ actor }) => {
    await actor.attemptsTo(
      AddProductToCart.named('Sauce Labs Backpack'),
      AddProductToCart.named('Sauce Labs Bike Light'),
    );
    expect(await actor.asks(CartBadgeCount.current())).toBe(2);

    await actor.attemptsTo(RemoveProductFromCart.named('Sauce Labs Bike Light'));

    expect(await actor.asks(CartBadgeCount.current())).toBe(1);
  });
});
