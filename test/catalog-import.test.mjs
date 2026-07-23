import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = process.cwd();
const fixture = join(root, 'test', 'fixtures', 'wger-catalog.fixture.json');

function importFixture(...extraArguments) {
  const outputDirectory = mkdtempSync(join(tmpdir(), 'barely-fit-catalog-'));
  const output = join(outputDirectory, 'catalog.json');
  const report = join(outputDirectory, 'report.json');
  const result = spawnSync(process.execPath, [
    'scripts/import-wger-catalog.mjs',
    '--input', fixture,
    '--output', output,
    '--report', report,
    ...extraArguments,
  ], { cwd: root, encoding: 'utf8' });

  return {
    catalog: result.status === 0 ? JSON.parse(readFileSync(output, 'utf8')) : undefined,
    report: result.status === 0 ? JSON.parse(readFileSync(report, 'utf8')) : undefined,
    result,
    dispose: () => rmSync(outputDirectory, { recursive: true, force: true }),
  };
}

test('imports reviewed catalog records with stable IDs and offline attribution', () => {
  const imported = importFixture();
  try {
    assert.equal(imported.result.status, 0, imported.result.stderr);
    assert.deepEqual(imported.catalog.exercises.map(({ id, name }) => ({ id, name })), [
      { id: 'wger-101', name: 'Barbell Back Squat' },
      { id: 'wger-102', name: 'Front Plank' },
    ]);
    assert.equal(imported.catalog.exercises[0].provenance.license, 'CC BY-SA 3.0');
    assert.equal(imported.catalog.exercises[0].illustration, undefined);
    assert.deepEqual(imported.report.excluded, [
      { sourceId: '103', reason: 'missing image rights metadata' },
      { sourceId: '104', reason: 'contradictory description rights metadata' },
      { sourceId: '101', reason: 'duplicate source mapping' },
      { sourceId: '105', reason: 'duplicate internal mapping' },
      { sourceId: '106', reason: 'unapproved description license' },
    ]);
  } finally {
    imported.dispose();
  }
});

test('reports catalog additions, removals, changed licensing, and duplicate mappings', () => {
  const imported = importFixture('--previous', join(root, 'test', 'fixtures', 'previous-catalog.json'));
  try {
    assert.equal(imported.result.status, 0, imported.result.stderr);
    assert.deepEqual(imported.report.changes, {
      additions: ['wger-102'],
      removals: ['wger-099'],
      changedLicensing: ['wger-101'],
      duplicateMappings: ['101', 'wger-101'],
    });
  } finally {
    imported.dispose();
  }
});
