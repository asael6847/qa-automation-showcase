import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta semántica para estados de test.
        pass: '#22c55e',
        fail: '#ef4444',
        skip: '#9ca3af',
        flaky: '#f59e0b',
      },
    },
  },
  plugins: [],
};

export default config;
