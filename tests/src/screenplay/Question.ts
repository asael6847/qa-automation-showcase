import type { Actor } from './Actor';

/**
 * Una Question consulta el estado del sistema bajo prueba y devuelve un valor
 * tipado `T` (un número, un texto, un booleano). Mantener las assertions detrás
 * de Questions hace que los specs expresen *qué* se verifica, no *cómo* se
 * extrae el dato del DOM.
 */
export interface Question<T> {
  answeredBy(actor: Actor): Promise<T>;
}
