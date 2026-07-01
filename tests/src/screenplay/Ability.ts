/**
 * Una Ability (habilidad) es algo que un Actor *puede hacer*. En el patrón
 * Screenplay, las habilidades encapsulan la integración con el mundo exterior
 * (un navegador, un cliente HTTP, una base de datos), de modo que las Tasks y
 * Questions permanezcan agnósticas a la herramienta concreta.
 *
 * Es una interfaz marcadora: no obliga a ningún método porque cada habilidad
 * expone la suya propia (p. ej. `BrowseTheWeb` expone la `Page`). Lo que sí
 * compartimos es la forma de identificarlas vía su constructor (ver Actor).
 */
// Interfaz marcadora intencional: no declara métodos porque cada habilidad
// concreta expone su propia API. Desactivamos la regla aquí a propósito.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Ability {}

/**
 * Tipo de un constructor de habilidad. Lo usamos como "llave" para guardar y
 * recuperar habilidades en el Actor de forma tipada, sin strings mágicos.
 */
export type AbilityConstructor<T extends Ability> = abstract new (...args: never[]) => T;
