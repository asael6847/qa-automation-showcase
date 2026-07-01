/**
 * Page Objects ligeros: aquí sólo centralizamos *selectores* y la URL de cada
 * página. La lógica de interacción vive en las Tasks/Questions. Esta separación
 * evita que un cambio de selector se esparza por toda la suite.
 */
export const LoginPage = {
  url: '/',
  usernameInput: '[data-test="username"]',
  passwordInput: '[data-test="password"]',
  loginButton: '[data-test="login-button"]',
  errorMessage: '[data-test="error"]',
} as const;
