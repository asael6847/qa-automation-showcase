export const CheckoutPage = {
  // Paso 1: datos del comprador.
  firstNameInput: '[data-test="firstName"]',
  lastNameInput: '[data-test="lastName"]',
  postalCodeInput: '[data-test="postalCode"]',
  continueButton: '[data-test="continue"]',
  // Paso 2: resumen de la orden (artículos y totales) y confirmación.
  overviewItemName: '.cart_item .inventory_item_name',
  summarySubtotal: '.summary_subtotal_label',
  summaryTotal: '.summary_total_label',
  finishButton: '[data-test="finish"]',
  completeHeader: '.complete-header',
} as const;
