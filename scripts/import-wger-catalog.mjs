import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function argument(name, required = true) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (required && !value) throw new Error(`Missing ${name}.`);
  return value;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function hasCompleteRights(rights) {
  return Boolean(rights?.source && rights.author && rights.license && rights.licenseUrl && rights.sourceUrl);
}

const reusableLicenses = new Set(['CC BY-SA 3.0', 'CC BY-SA 4.0']);

function sameRights(left, right) {
  return left.source === right.source
    && left.author === right.author
    && left.license === right.license
    && left.licenseUrl === right.licenseUrl
    && left.sourceUrl === right.sourceUrl;
}

function contentHash(exercises) {
  return createHash('sha256').update(JSON.stringify(exercises)).digest('hex');
}

function outputExercise(record, snapshot) {
  const illustration = record.image ? {
    url: record.image.url,
    source: record.image.rights.source,
    author: record.image.rights.author,
    license: record.image.rights.license,
    licenseUrl: record.image.rights.licenseUrl,
    sourceUrl: record.image.rights.sourceUrl,
  } : undefined;
  return {
    // A reviewed snapshot may deliberately preserve an existing internal ID
    // while still retaining the immutable upstream source ID in provenance.
    id: record.internalId ?? `wger-${record.sourceId}`,
    catalog: true,
    name: record.name,
    instructions: record.instructions,
    primaryMuscles: record.primaryMuscles,
    secondaryMuscles: record.secondaryMuscles,
    equipment: record.equipment,
    measurementType: record.measurementType,
    placeholderLabel: 'No approved illustration available',
    illustration,
    provenance: {
      source: record.descriptionRights.source,
      sourceId: record.sourceId,
      sourceUrl: record.descriptionRights.sourceUrl,
      author: record.descriptionRights.author,
      license: record.descriptionRights.license,
      licenseUrl: record.descriptionRights.licenseUrl,
      snapshotDate: snapshot.snapshotDate,
      revision: snapshot.revision,
      modified: false,
      reviewStatus: 'verified',
    },
  };
}

function main() {
  const input = argument('--input');
  const output = argument('--output');
  const reportFile = argument('--report');
  const previousFile = argument('--previous', false);
  const source = readJson(input);
  if (!source.snapshot.contentSha256 || source.snapshot.contentSha256 !== contentHash(source.exercises)) {
    throw new Error('Snapshot content hash does not match its pinned metadata.');
  }
  const seenSourceIds = new Set();
  const seenInternalIds = new Set();
  const exercises = [];
  const excluded = [];
  const duplicateMappings = [];

  for (const record of source.exercises) {
    if (seenSourceIds.has(record.sourceId)) {
      excluded.push({ sourceId: record.sourceId, reason: 'duplicate source mapping' });
      duplicateMappings.push(record.sourceId);
      continue;
    }
    seenSourceIds.add(record.sourceId);
    const internalId = record.internalId ?? `wger-${record.sourceId}`;
    if (seenInternalIds.has(internalId)) {
      excluded.push({ sourceId: record.sourceId, reason: 'duplicate internal mapping' });
      duplicateMappings.push(internalId);
      continue;
    }
    seenInternalIds.add(internalId);
    if (!record.reviewed || !hasCompleteRights(record.descriptionRights)) {
      excluded.push({ sourceId: record.sourceId, reason: 'missing description rights metadata' });
      continue;
    }
    if (!reusableLicenses.has(record.descriptionRights.license)) {
      excluded.push({ sourceId: record.sourceId, reason: 'unapproved description license' });
      continue;
    }
    if (record.image && !hasCompleteRights(record.image.rights)) {
      excluded.push({ sourceId: record.sourceId, reason: 'missing image rights metadata' });
      continue;
    }
    if (record.image && !reusableLicenses.has(record.image.rights.license)) {
      excluded.push({ sourceId: record.sourceId, reason: 'unapproved image license' });
      continue;
    }
    if (record.image && !sameRights(record.descriptionRights, record.image.rights)) {
      excluded.push({ sourceId: record.sourceId, reason: 'contradictory description rights metadata' });
      continue;
    }
    exercises.push(outputExercise(record, source.snapshot));
  }

  const catalog = { snapshot: source.snapshot, exercises };
  const previous = previousFile ? readJson(previousFile) : { exercises: [] };
  const oldById = new Map(previous.exercises.map((exercise) => [exercise.id, exercise]));
  const importedIds = new Set(exercises.map((exercise) => exercise.id));
  const changes = {
    additions: exercises.filter((exercise) => !oldById.has(exercise.id)).map((exercise) => exercise.id),
    removals: previous.exercises.filter((exercise) => !importedIds.has(exercise.id)).map((exercise) => exercise.id),
    changedLicensing: exercises.filter((exercise) => oldById.has(exercise.id) && !sameRights(oldById.get(exercise.id).provenance, exercise.provenance)).map((exercise) => exercise.id),
    duplicateMappings,
  };
  const report = { snapshot: source.snapshot, imported: exercises.length, excluded, changes };

  for (const [file, content] of [[output, catalog], [reportFile, report]]) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(content, null, 2)}\n`);
  }
  console.log(`Imported ${exercises.length} Exercise records; excluded ${excluded.length}.`);
}

main();
