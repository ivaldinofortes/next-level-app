#!/usr/bin/env node
/**
 * Verificação mínima pré-entrega da build de produção.
 * Uso: node scripts/verify-release.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'package.json',
  'main.cjs',
  'preload.cjs',
  'dist/index.html',
  'resources/seed.db',
  'build/icon.ico',
  'build/icon.png',
  'LICENSE.txt',
];

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const errors = [];

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) errors.push(`Em falta: ${rel}`);
}

if (!pkg.version) errors.push('package.json sem version');
if (pkg.main !== 'main.cjs') errors.push('package.json main deve ser main.cjs');

const seed = path.join(root, 'resources/seed.db');
if (fs.existsSync(seed) && fs.statSync(seed).size < 1024) {
  errors.push('resources/seed.db parece vazio ou corrompido');
}

console.log(`Next Level Academia — verify-release`);
console.log(`Versão: ${pkg.version}`);
console.log(`Product: ${pkg.productName || pkg.name}`);

if (errors.length) {
  console.error('\nFALHA:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('\nOK — artefactos mínimos de release presentes.');
console.log('Seguinte: npm run dist:win (em Windows ou CI) para gerar instaladores.');
process.exit(0);
