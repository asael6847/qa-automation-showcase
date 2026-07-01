import type { Actor } from './Actor';

/**
 * Una Task representa una unidad de intención de negocio ("hacer login",
 * "agregar producto al carrito"). Las tareas se componen entre sí: una tarea
 * de alto nivel puede delegar en otras más pequeñas a través de
 * `actor.attemptsTo(...)`. Esa composición es lo que da legibilidad y reuso.
 *
 * No confundir con la *interacción* concreta con el navegador: eso vive en la
 * Ability `BrowseTheWeb`. La Task sólo orquesta el "qué".
 */
export interface Task {
  performAs(actor: Actor): Promise<void>;
}
