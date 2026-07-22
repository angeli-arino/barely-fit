import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const requiredFiles = [
  'src/App.tsx',
  'src/state/AppState.tsx',
  'src/state/persistence.ts',
  'src/data/mockData.ts',
  'src/pages/SignInPage.tsx',
  'src/pages/TodayPage.tsx',
  'src/pages/ActiveWorkoutPage.tsx',
  'src/pages/WorkoutSchedulePage.tsx',
  'src/pages/TemplatesPage.tsx',
  'src/pages/TemplateEditorPage.tsx',
  'src/pages/ExerciseCatalogPage.tsx',
  'src/pages/HistoryPage.tsx',
  'src/pages/WorkoutDetailPage.tsx',
  'src/pages/ProgressPage.tsx',
  'src/pages/SettingsPage.tsx',
  'DESIGN-HANDOFF.md',
  'public/manifest.webmanifest',
  '.github/workflows/deploy-pages.yml',
];

const routes = [
  '/sign-in', '/today', '/workout/active', '/plan', '/templates',
  '/templates/:templateId', '/exercises', '/history', '/history/:workoutId',
  '/progress', '/settings',
];

const errors = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Missing required file: ${file}`);
}

const appSource = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
for (const route of routes) {
  if (!appSource.includes(`path="${route}"`)) errors.push(`Missing route: ${route}`);
}

const stateSource = fs.readFileSync(path.join(root, 'src/state/AppState.tsx'), 'utf8');
for (const rule of ['status === \'active\'', 'savePersistedState', "type: 'update-set-draft'", "type: 'complete-set'", "type: 'timer-tick'", "type: 'correct-completed-set'", "type: 'save-template'", "type: 'update-template-from-workout'", "type: 'reschedule-planned-workout'", 'recurrenceSeriesId', 'recurrenceEndDate']) {
  if (!stateSource.includes(rule)) errors.push(`State rule not found: ${rule}`);
}
const todaySource = fs.readFileSync(path.join(root, 'src/pages/TodayPage.tsx'), 'utf8');
for (const rule of ["workoutId: todayPlannedWorkout.id", 'fourWeekVolume', 'recentRun']) {
  if (!todaySource.includes(rule)) errors.push(`Today data rule not found: ${rule}`);
}
const persistenceSource = fs.readFileSync(path.join(root, 'src/state/persistence.ts'), 'utf8');
for (const rule of ['indexedDB.open', "const OUTBOX_STORE = 'outbox'", 'queueForSync']) {
  if (!persistenceSource.includes(rule)) errors.push(`Persistence rule not found: ${rule}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
if (manifest.display !== 'standalone') errors.push('Manifest must use standalone display.');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) errors.push('Manifest icons are incomplete.');
if (manifest.start_url !== './' || manifest.scope !== './') errors.push('Manifest must remain within the GitHub Pages project path.');

const viteSource = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
if (!viteSource.includes("'/barely-fit/'")) errors.push('Vite GitHub Pages base path is missing.');
const mainSource = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');
if (!mainSource.includes('basename={import.meta.env.BASE_URL}')) errors.push('Router GitHub Pages basename is missing.');
const pagesWorkflow = fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8');
for (const rule of ['actions/configure-pages', 'actions/upload-pages-artifact', 'actions/deploy-pages', 'dist/404.html']) {
  if (!pagesWorkflow.includes(rule)) errors.push(`GitHub Pages workflow rule not found: ${rule}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Static verification passed: ${requiredFiles.length} files, ${routes.length} routes, local-first state rules, and manifest.`);
