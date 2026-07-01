import { test, expect } from '@playwright/test';
import path from 'node:path';
import { Evidence } from './Evidence';
import { generatePdf } from './pdf';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

const PASSWORD = 'secret_sauce';
const PRODUCTOS = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'];

/**
 * Genera evidencia visual del flujo de compra de varios artículos: cada paso se
 * captura con el elemento resaltado y numerado, y al final se exporta un PDF que
 * además se adjunta al reporte de Playwright (queda como artefacto en CI).
 */
test('evidencia: compra de varios artículos', async ({ page }, testInfo) => {
  const ev = new Evidence('Compra de varios artículos — Flujo E2E sobre SauceDemo');

  // 1. Login.
  await page.goto(LoginPage.url);
  await ev.capture(page, 'Pantalla de inicio de sesión', LoginPage.usernameInput);

  await page.fill(LoginPage.usernameInput, 'standard_user');
  await page.fill(LoginPage.passwordInput, PASSWORD);
  await ev.capture(page, 'Credenciales ingresadas; se pulsará "Login"', LoginPage.loginButton);
  await page.click(LoginPage.loginButton);

  // 2. Inventario.
  await ev.capture(page, 'Inventario de productos', InventoryPage.title);

  // 3. Agregar cada artículo al carrito.
  for (const producto of PRODUCTOS) {
    await ev.capture(page, `Agregar al carrito: ${producto}`, InventoryPage.addToCartButton(producto));
    await page.click(InventoryPage.addToCartButton(producto));
  }

  // 4. El carrito refleja los 3 artículos.
  await ev.capture(page, 'El carrito refleja 3 artículos', InventoryPage.shoppingCartBadge);
  await page.click(InventoryPage.shoppingCartLink);

  // 5. Carrito → checkout.
  await ev.capture(page, 'Carrito de compras con los artículos añadidos', CartPage.checkoutButton);
  await page.click(CartPage.checkoutButton);

  // 6. Datos del comprador.
  await page.fill(CheckoutPage.firstNameInput, 'Ana');
  await page.fill(CheckoutPage.lastNameInput, 'Quishpe');
  await page.fill(CheckoutPage.postalCodeInput, '170101');
  await ev.capture(page, 'Datos del comprador completados; se continuará', CheckoutPage.continueButton);
  await page.click(CheckoutPage.continueButton);

  // 7. Resumen de la orden.
  await ev.capture(page, 'Resumen de la orden; se finalizará la compra', CheckoutPage.finishButton);
  await page.click(CheckoutPage.finishButton);

  // 8. Confirmación.
  await ev.capture(page, 'Compra finalizada: orden confirmada', CheckoutPage.completeHeader);
  await expect(page.locator(CheckoutPage.completeHeader)).toHaveText('Thank you for your order!');

  // Exportar el PDF de evidencia y adjuntarlo al reporte.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
  const pdfPath = path.resolve('evidence', `evidencia-compra-${stamp}.pdf`);
  await generatePdf(ev, pdfPath);
  await testInfo.attach('Evidencia de compra (PDF)', {
    path: pdfPath,
    contentType: 'application/pdf',
  });
  console.log(`Evidencia PDF generada en: ${pdfPath}`);
});
