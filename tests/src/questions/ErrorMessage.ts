import { Actor, BrowseTheWeb, Question } from '@screenplay';
import { LoginPage } from '../pages/LoginPage';

/**
 * Question: el texto del mensaje de error del login (credenciales inválidas o
 * usuario bloqueado). Devuelve cadena vacía si no hay error visible.
 */
export class ErrorMessage implements Question<string> {
  static text(): ErrorMessage {
    return new ErrorMessage();
  }

  async answeredBy(actor: Actor): Promise<string> {
    const page = actor.abilityTo(BrowseTheWeb).currentPage();
    const error = page.locator(LoginPage.errorMessage);
    if ((await error.count()) === 0) {
      return '';
    }
    return (await error.textContent())?.trim() ?? '';
  }
}
