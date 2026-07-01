import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // El patrón Screenplay vive de interfaces y genéricos; permitimos `any`
      // sólo cuando esté justificado con un comentario explícito.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['playwright-report/', 'test-results/', 'reports/', 'node_modules/'],
  },
);
