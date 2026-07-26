import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(file, 'utf8');

test('release automation covers browser, policy, bundle, and secret gates', () => {
  const workflow = read('.github/workflows/release.yml');
  for (const gate of [
    'pnpm test',
    'pnpm test:browser',
    'pnpm verify:release',
    'supabase test db --local',
    'pages deploy dist --project-name=barely-fit',
  ]) {
    assert.match(workflow, new RegExp(gate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('operational handoff covers every private-beta failure and recovery path', () => {
  const runbook = read('docs/private-beta-operations.md').toLowerCase();
  for (const topic of [
    'install on iphone',
    'notification permission',
    'permission denied',
    'offline',
    'backend pause',
    'recoverable sync failure',
    'restore',
    'troubleshooting',
    'deferred features',
  ]) {
    assert.ok(runbook.includes(topic), `Missing runbook topic: ${topic}`);
  }
});

test('production build uses the approved Cloudflare root deployment', () => {
  const vite = read('vite.config.ts');
  const readme = read('README.md');
  assert.match(vite, /mode === 'e2e' \? '\/barely-fit\/' : '\/'/);
  assert.match(readme, /Cloudflare Pages/);
  assert.doesNotMatch(readme, /## GitHub Pages/);
});
