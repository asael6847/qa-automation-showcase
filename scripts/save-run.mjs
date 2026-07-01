#!/usr/bin/env node
/**
 * Copia el último reporte JSON de Playwright (tests/reports/results.json) al
 * historial del dashboard (dashboard/public/runs/) con un nombre basado en la
 * fecha de la corrida. Así cada ejecución alimenta la tendencia del dashboard.
 *
 * Uso: node scripts/save-run.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'tests', 'reports', 'results.json');
const targetDir = path.join(root, 'dashboard', 'public', 'runs');

if (!fs.existsSync(source)) {
  console.error('No existe tests/reports/results.json. Corre primero `pnpm test`.');
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

const report = JSON.parse(fs.readFileSync(source, 'utf-8'));
const startTime = report?.stats?.startTime ?? new Date().toISOString();
// run-2026-06-25T19-44-56 -> ordenable y único por corrida.
const stamp = startTime.replace(/[:.]/g, '-').replace(/Z$/, '');
const targetFile = path.join(targetDir, `run-${stamp}.json`);

fs.copyFileSync(source, targetFile);
console.log(`Corrida guardada en ${path.relative(root, targetFile)}`);
