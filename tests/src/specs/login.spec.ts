import { test, expect } from '../fixtures/actors';
import { Login } from '../tasks/Login';
import { PageTitle } from '../questions/PageTitle';
import { ErrorMessage } from '../questions/ErrorMessage';

/**
 * Credenciales públicas de SauceDemo (documentadas en su propia pantalla de
 * login). Las dejamos como constantes locales para legibilidad.
 */
const PASSWORD = 'secret_sauce';

test.describe('Login', () => {
  test('login exitoso con standard_user lleva al inventario', async ({ actor }) => {
    await actor.attemptsTo(Login.withCredentials('standard_user', PASSWORD));

    // La presencia del título "Products" confirma que estamos en el inventario.
    expect(await actor.asks(PageTitle.current())).toBe('Products');
  });

  test('login con credenciales inválidas muestra mensaje de error', async ({ actor }) => {
    await actor.attemptsTo(Login.withCredentials('usuario_inexistente', 'mala_password'));

    expect(await actor.asks(ErrorMessage.text())).toContain('Username and password do not match');
  });

  test('login con locked_out_user muestra mensaje de bloqueo', async ({ actor }) => {
    await actor.attemptsTo(Login.withCredentials('locked_out_user', PASSWORD));

    expect(await actor.asks(ErrorMessage.text())).toContain('Sorry, this user has been locked out');
  });
});
