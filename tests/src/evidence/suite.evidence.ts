import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import type { Evidence } from './Evidence';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

/**
 * Evidencia visual de TODA la suite: cada escenario se recorre paso a paso
 * resaltando y numerando cada acción, y todo se consolida en un único PDF.
 * Reusa los mismos Page Objects que la suite de regresión (selectores DRY).
 */

const PASSWORD = 'secret_sauce';
const PRODUCTOS = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'];

/** Inicia sesión capturando cada paso. Deja al actor en el inventario. */
async function loginConEvidencia(page: Page, evidence: Evidence, user: string): Promise<void> {
  await page.goto(LoginPage.url);
  await evidence.capture(page, 'Abrir la pantalla de inicio de sesión', LoginPage.usernameInput);
  await page.fill(LoginPage.usernameInput, user);
  await page.fill(LoginPage.passwordInput, PASSWORD);
  await evidence.capture(page, `Ingresar credenciales de ${user} y pulsar Login`, LoginPage.loginButton);
  await page.click(LoginPage.loginButton);
}

test.describe('Evidencia — Suite E2E', () => {
  test('Login exitoso lleva al inventario', async ({ page, evidence }) => {
    await loginConEvidencia(page, evidence, 'standard_user');
    await evidence.capture(page, 'Se muestra el inventario de productos', InventoryPage.title);
    await expect(page.locator(InventoryPage.title)).toHaveText('Products');
  });

  test('Login con credenciales inválidas muestra error', async ({ page, evidence }) => {
    await page.goto(LoginPage.url);
    await page.fill(LoginPage.usernameInput, 'usuario_inexistente');
    await page.fill(LoginPage.passwordInput, 'clave_incorrecta');
    await evidence.capture(page, 'Ingresar credenciales inválidas y pulsar Login', LoginPage.loginButton);
    await page.click(LoginPage.loginButton);
    await evidence.capture(page, 'Se muestra el mensaje de error de credenciales', LoginPage.errorMessage);
    await expect(page.locator(LoginPage.errorMessage)).toContainText(
      'Username and password do not match',
    );
  });

  test('Login con usuario bloqueado muestra error', async ({ page, evidence }) => {
    await page.goto(LoginPage.url);
    await page.fill(LoginPage.usernameInput, 'locked_out_user');
    await page.fill(LoginPage.passwordInput, PASSWORD);
    await evidence.capture(page, 'Intentar ingresar con un usuario bloqueado', LoginPage.loginButton);
    await page.click(LoginPage.loginButton);
    await evidence.capture(page, 'Se muestra el mensaje de usuario bloqueado', LoginPage.errorMessage);
    await expect(page.locator(LoginPage.errorMessage)).toContainText('locked out');
  });

  test('Agregar un producto deja el carrito en 1', async ({ page, evidence }) => {
    await loginConEvidencia(page, evidence, 'standard_user');
    await evidence.capture(page, `Agregar "${PRODUCTOS[0]}" al carrito`, InventoryPage.addToCartButton(PRODUCTOS[0]));
    await page.click(InventoryPage.addToCartButton(PRODUCTOS[0]));
    await evidence.capture(page, 'El badge del carrito marca 1', InventoryPage.shoppingCartBadge);
    await expect(page.locator(InventoryPage.shoppingCartBadge)).toHaveText('1');
  });

  test('Agregar varios productos refleja la cantidad', async ({ page, evidence }) => {
    await loginConEvidencia(page, evidence, 'standard_user');
    for (const producto of PRODUCTOS) {
      await evidence.capture(page, `Agregar "${producto}" al carrito`, InventoryPage.addToCartButton(producto));
      await page.click(InventoryPage.addToCartButton(producto));
    }
    await evidence.capture(page, 'El badge del carrito marca 3', InventoryPage.shoppingCartBadge);
    await expect(page.locator(InventoryPage.shoppingCartBadge)).toHaveText('3');
  });

  test('Remover un producto actualiza el carrito', async ({ page, evidence }) => {
    await loginConEvidencia(page, evidence, 'standard_user');
    // En el inventario el botón "Add to cart" pasa a ser "Remove" tras agregar.
    await page.click(InventoryPage.addToCartButton(PRODUCTOS[0]));
    await evidence.capture(page, `Producto agregado; se removerá "${PRODUCTOS[0]}"`, InventoryPage.addToCartButton(PRODUCTOS[0]));
    await page.click(InventoryPage.addToCartButton(PRODUCTOS[0]));
    await evidence.capture(page, 'El carrito queda vacío (sin badge)', InventoryPage.shoppingCartLink);
    await expect(page.locator(InventoryPage.shoppingCartBadge)).toHaveCount(0);
  });

  test('Compra de un artículo se finaliza', async ({ page, evidence }) => {
    await loginConEvidencia(page, evidence, 'standard_user');
    await page.click(InventoryPage.addToCartButton(PRODUCTOS[0]));
    await evidence.capture(page, 'Abrir el carrito', InventoryPage.shoppingCartLink);
    await page.click(InventoryPage.shoppingCartLink);
    await evidence.capture(page, 'Continuar al checkout', CartPage.checkoutButton);
    await page.click(CartPage.checkoutButton);
    await page.fill(CheckoutPage.firstNameInput, 'Ana');
    await page.fill(CheckoutPage.lastNameInput, 'Quishpe');
    await page.fill(CheckoutPage.postalCodeInput, '170101');
    await evidence.capture(page, 'Completar los datos del comprador y continuar', CheckoutPage.continueButton);
    await page.click(CheckoutPage.continueButton);
    await evidence.capture(page, 'Finalizar la compra', CheckoutPage.finishButton);
    await page.click(CheckoutPage.finishButton);
    await evidence.capture(page, 'Orden confirmada', CheckoutPage.completeHeader);
    await expect(page.locator(CheckoutPage.completeHeader)).toHaveText('Thank you for your order!');
  });

  test('Compra de varios artículos se finaliza', async ({ page, evidence }) => {
    await loginConEvidencia(page, evidence, 'standard_user');
    for (const producto of PRODUCTOS) {
      await page.click(InventoryPage.addToCartButton(producto));
    }
    await evidence.capture(page, 'Carrito con 3 artículos; abrir el carrito', InventoryPage.shoppingCartBadge);
    await page.click(InventoryPage.shoppingCartLink);
    await evidence.capture(page, 'Continuar al checkout', CartPage.checkoutButton);
    await page.click(CartPage.checkoutButton);
    await page.fill(CheckoutPage.firstNameInput, 'Ana');
    await page.fill(CheckoutPage.lastNameInput, 'Quishpe');
    await page.fill(CheckoutPage.postalCodeInput, '170101');
    await evidence.capture(page, 'Completar los datos del comprador y continuar', CheckoutPage.continueButton);
    await page.click(CheckoutPage.continueButton);
    await evidence.capture(page, 'Resumen con los artículos; finalizar la compra', CheckoutPage.finishButton);
    await page.click(CheckoutPage.finishButton);
    await evidence.capture(page, 'Orden confirmada', CheckoutPage.completeHeader);
    await expect(page.locator(CheckoutPage.completeHeader)).toHaveText('Thank you for your order!');
  });
});
