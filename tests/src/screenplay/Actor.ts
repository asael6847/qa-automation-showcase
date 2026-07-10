import type { Ability, AbilityConstructor } from './Ability';
import type { Task } from './Task';
import type { Question } from './Question';

/**
 * El Actor es el centro del patrón Screenplay: representa a un usuario (o
 * sistema) que persigue un objetivo. No sabe *cómo* se hacen las cosas; delega
 * el "cómo" en sus Abilities y compone su comportamiento mediante Tasks.
 *
 * Diseño:
 *  - `can(ability)` le otorga una habilidad (estilo builder, devuelve el Actor).
 *  - `attemptsTo(...tasks)` ejecuta tareas en orden, secuencialmente.
 *  - `asks(question)` resuelve el estado del sistema (assertions legibles).
 *  - `abilityTo(Class)` recupera una habilidad de forma tipada.
 */
export class Actor {
  // Las habilidades se indexan por su constructor para recuperación tipada.
  private readonly abilities = new Map<AbilityConstructor<Ability>, Ability>();

  private constructor(public readonly name: string) {}

  /** Crea un actor con un nombre descriptivo (aparece en logs y reportes). */
  static named(name: string): Actor {
    return new Actor(name);
  }

  /** Otorga una habilidad al actor. Encadenable: `Actor.named('Asael').can(...)`. */
  can(ability: Ability): this {
    this.abilities.set(ability.constructor as AbilityConstructor<Ability>, ability);
    return this;
  }

  /**
   * Recupera una habilidad por su clase. Lanza si el actor no la tiene: un test
   * mal montado debe fallar ruidosamente, no en silencio.
   */
  abilityTo<T extends Ability>(ability: AbilityConstructor<T>): T {
    const found = this.abilities.get(ability);
    if (!found) {
      throw new Error(
        `${this.name} no tiene la habilidad ${ability.name}. ` +
          `Usa actor.can(${ability.name}.using(...)) antes de intentar la tarea.`,
      );
    }
    return found as T;
  }

  /** Ejecuta tareas/acciones en secuencia. El test se lee como prosa de negocio. */
  async attemptsTo(...tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      await task.performAs(this);
    }
  }

  /** Resuelve una Question y devuelve su valor, listo para el `expect(...)`. */
  async asks<T>(question: Question<T>): Promise<T> {
    return question.answeredBy(this);
  }
}
