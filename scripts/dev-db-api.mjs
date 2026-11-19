// Local data API for `npm run dev`: runs PostgREST on http://localhost:3001 against the local
// database (LOCAL_DATABASE_URL in .env). Vite proxies /api/db to it — same path as production.
//   npm run db:api
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, '')])
);

const dbUri = process.env.PGRST_DB_URI || env.LOCAL_DATABASE_URL || env.DATABASE_URL;
if (!dbUri) {
  console.error('Set LOCAL_DATABASE_URL in .env (postgres://user:password@localhost:5432/website_creator_os_v2_dev)');
  process.exit(1);
}

const exe = path.join(root, 'tools', 'postgrest', process.platform === 'win32' ? 'postgrest.exe' : 'postgrest');
if (!fs.existsSync(exe)) {
  console.error(`PostgREST not found at ${exe} — download v12.2.3 from https://github.com/PostgREST/postgrest/releases`);
  process.exit(1);
}

// On Windows postgrest.exe loads libpq.dll from the PostgreSQL install
let extraPath = '';
if (process.platform === 'win32') {
  const pgRoot = 'C:\\Program Files\\PostgreSQL';
  const versions = fs.existsSync(pgRoot) ? fs.readdirSync(pgRoot).sort((a, b) => Number(b) - Number(a)) : [];
  const bin = versions.map((v) => path.join(pgRoot, v, 'bin')).find((dir) => fs.existsSync(path.join(dir, 'libpq.dll')));
  if (bin) extraPath = bin + path.delimiter;
}

const child = spawn(exe, [], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: extraPath + process.env.PATH,
    PGRST_DB_URI: dbUri,
    PGRST_DB_SCHEMAS: 'public',
    PGRST_DB_ANON_ROLE: 'wco_web',
    PGRST_SERVER_HOST: '127.0.0.1',
    PGRST_SERVER_PORT: '3001'
  }
});
child.on('exit', (code) => process.exit(code ?? 0));
