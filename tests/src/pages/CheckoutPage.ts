export const CheckoutPage = {
  // Paso 1: datos del comprador.
  firstNameInput: '[data-test="firstName"]',
  lastNameInput: '[data-test="lastName"]',
  postalCodeInput: '[data-test="postalCode"]',
  continueButton: '[data-test="continue"]',
  // Paso 2: resumen y confirmación.
  finishButton: '[data-test="finish"]',
  completeHeader: '.complete-header',
} as const;
