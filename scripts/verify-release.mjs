import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const walk = (directory) => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
  const relative = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(relative) : [relative];
});
const errors = [];

const authConfig = read('supabase/config.toml');
if (!/enable_signup\s*=\s*false/.test(authConfig)) errors.push('Supabase public signup must be disabled.');

const supabaseClient = read('src/lib/supabase.ts');
for (const rule of ['persistSession: true', 'autoRefreshToken: true', 'assert_authorized_member']) {
  if (!supabaseClient.includes(rule)) errors.push(`Authentication persistence rule missing: ${rule}`);
}

const migrations = walk('supabase/migrations').map(read).join('\n').toLowerCase();
const publicTables = [...migrations.matchAll(/create table(?: if not exists)? public\.([a-z0-9_]+)/g)].map((match) => match[1]);
for (const table of new Set(publicTables)) {
  if (!migrations.includes(`alter table public.${table} enable row level security`)) {
    errors.push(`Public table lacks Row Level Security: ${table}`);
  }
  if (!migrations.includes(`alter table public.${table} force row level security`)) {
    errors.push(`Public table does not force Row Level Security: ${table}`);
  }
}

const publicFiles = [...walk('src'), ...walk('public'), ...walk('dist')]
  .filter((file) => !/\.(png|jpg|jpeg|gif|webp|woff2?)$/i.test(file));
const forbidden = [
  ['service-role credential', /(?:service[_-]?role|service_role_key)\s*[:=]\s*['"`][A-Za-z0-9._-]{16,}/i],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{16,}\b/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['server-only secret', /(?:VAPID_PRIVATE_KEY|CRON_SECRET)\s*[:=]\s*['"`][^'"`\s]{8,}/],
];
for (const file of publicFiles) {
  const source = read(file);
  for (const [label, pattern] of forbidden) {
    if (pattern.test(source)) errors.push(`${label} found in public source or bundle: ${file}`);
  }
}

const trackedFiles = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => fs.existsSync(path.join(root, file)))
  .filter((file) => !/\.(?:png|jpg|jpeg|gif|webp|woff2?|zip)$/i.test(file));
for (const file of trackedFiles) {
  const source = read(file);
  if (/\bsb_secret_[A-Za-z0-9_-]{16,}\b/.test(source) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) {
    errors.push(`Committed server credential found: ${file}`);
  }
  for (const token of source.match(/[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g) ?? []) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
      if (payload.role === 'service_role') errors.push(`Supabase service-role JWT found: ${file}`);
    } catch {
      // A dotted string that is not a JWT is not a credential finding.
    }
  }
}

const bundle = walk('dist').filter((file) => /\.(?:js|html|json|webmanifest)$/i.test(file)).map(read).join('\n');
for (const deferred of ['Additional Members', 'GPT recommendations', 'Fitbod Import', 'Exports and backups', 'Apple Health', 'External calendars', 'Videos', 'GPS', 'HIIT programming']) {
  if (bundle.includes(deferred) && !bundle.includes('Coming later')) {
    errors.push(`Deferred feature is not clearly marked non-interactive: ${deferred}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Release verification passed: signup disabled, ${new Set(publicTables).size} public tables protected by RLS, ${trackedFiles.length} tracked files secret-scanned, and ${publicFiles.length} public files inspected.`);
