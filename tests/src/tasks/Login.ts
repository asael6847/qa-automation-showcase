import { Actor, BrowseTheWeb, Task } from '@screenplay';
import { LoginPage } from '../pages/LoginPage';

/**
 * Task: iniciar sesión en SauceDemo con un par de credenciales.
 *
 * Factory estática `withCredentials(...)` para que el spec se lea como prosa:
 *   actor.attemptsTo(Login.withCredentials('standard_user', 'secret_sauce'))
 */
export class Login implements Task {
  private constructor(
    private readonly username: string,
    private readonly password: string,
  ) {}

  static withCredentials(username: string, password: string): Login {
    return new Login(username, password);
  }

  async performAs(actor: Actor): Promise<void> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    await page.goto(LoginPage.url);
    await page.fill(LoginPage.usernameInput, this.username);
    await page.fill(LoginPage.passwordInput, this.password);
    await page.click(LoginPage.loginButton);
  }
}
